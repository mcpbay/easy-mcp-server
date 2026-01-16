/// <reference lib="deno.ns" />
import { isUndefined } from "@online/is";
import { Transport } from "./src/abstractions/mod.ts";
import { INTERNAL_ERROR, INVALID_PARAMS } from "./src/constants/mod.ts";
import { RequestException } from "./src/exceptions/mod.ts";
import { errorResponse, progressNotification, successResponse } from "./src/generators/mod.ts";
import {
  type ICapabilities,
  type IClientMinimalRequestStructure,
  type IInitializeResponse,
  type IPingResponse,
  type IPrompt,
  type IPromptMessage,
  type IPromptsListResponse,
  type IContextModel,
  type IContextModelOptions,
  type IGenericRequest,
  type IRequestParamsMetadata,
  type IToolsListResponse,
  type IPromptsGetResponse,
  type ICompletionCompleteResponse,
  ContextModelEntityType,
  IToolsCallResponse
} from "./src/interfaces/mod.ts";
import { StdioTransport } from "./src/transports/mod.ts";
import type { IMessageHandlerClass, RequestId } from "./src/types/mod.ts";
import { crashIfNot, textToSlug } from "./src/utils/mod.ts";
import {
  isCancelledNotification,
  isCompletionCompleteRequest,
  isGenericRequest,
  isInitializedNotification,
  isInitializeRequest,
  isPingRequest,
  isPromptsGetRequest,
  isPromptsListRequest,
  isToolsCallRequest,
  isToolsListRequest,
} from "./src/validators/mod.ts";

function writeLog(line: string) {
  const todayDateString = new Date().toISOString().split("T")[0];

  Deno.writeTextFileSync(
    `E:/Git/profit/node/mcpbay/easymcp/logs/${todayDateString}.log`,
    `${line}\n`,
    { append: true },
  );
}

const DEFAULT_PROTOCOL_VERSION = "2025-11-25" as const;
const DEFAULT_CAPABILITIES: ICapabilities = {
  completions: { listChanged: false },
  prompts: { listChanged: false },
  resources: { listChanged: false },
  tools: { listChanged: false },
} as const;

export interface IEasyMCPConfig {
  timeout: number;
}

export class EasyMCPServer implements IMessageHandlerClass {
  private readonly jobs: Map<RequestId, AbortController> = new Map();

  constructor(
    private readonly transport: Transport,
    private readonly contextModel: IContextModel,
    private readonly config?: Partial<IEasyMCPConfig>,
  ) { }

  // A wrapper to set the `AbortController` on every `ContextModel` event.
  async messageHandler(message: object) {
    const abortController = new AbortController();
    const possibleId: RequestId | undefined =
      (message as IClientMinimalRequestStructure)?.id;

    writeLog("Before SetTimeout...");

    setTimeout(
      () => { abortController.abort(); },
      this.config?.timeout || 10000,
    );

    writeLog("After SetTimeout...");

    abortController.signal.addEventListener("abort", () => {
      if (!possibleId) {
        return;
      }

      this.transport.response(errorResponse(possibleId, {
        code: INTERNAL_ERROR,
        message: "Request timed out",
      }));
    });

    writeLog("Executing messageHandler...");

    const isCancellableRequest = isGenericRequest(message) && !isInitializeRequest(message);

    try {
      if (isCancellableRequest) {
        this.registerRequestJob(message.id, abortController);
      }

      await this.internalMessageHandler(message, abortController);
    } catch (e) {
      writeLog("Error stack: " + JSON.stringify((e as Error).stack));
      writeLog("Error message: " + JSON.stringify((e as Error).message));

      if (e instanceof RequestException) {

        writeLog("possibleId: " + possibleId);

        if (isUndefined(possibleId)) {
          return;
        }

        writeLog("Error data: " + JSON.stringify(e.data));

        this.transport.response(errorResponse(possibleId, {
          code: e.status,
          message: e.message,
          data: e.data,
        }));
      }
    } finally {
      if (isCancellableRequest) {
        this.unregisterRequestJob(message.id);
      }
    }
  }

  private async internalMessageHandler(
    message: object,
    abortController: AbortController,
  ) {
    const contextOptions: IContextModelOptions = {
      abortController,
      progress: async (value: number, total?: number) => {
        const progressToken = ((message as IGenericRequest).params as IRequestParamsMetadata)._meta?.progressToken;

        crashIfNot(value >= 0 && value <= 1, {
          code: INVALID_PARAMS,
          message: "Progress value must be between 0 and 1",
        });

        if (!isUndefined(total)) {
          crashIfNot(total > 0 && total <= 1, {
            code: INVALID_PARAMS,
            message: "Progress total must be between 0 and 1",
          });
        }

        if (!progressToken) {
          return;
        }

        await this.transport.notify(progressNotification(progressToken, value, total));
      },
    };

    writeLog("Message handler of: " + JSON.stringify(message));

    switch (true) {
      case isInitializeRequest(message): {
        const { id, params } = message;

        writeLog("Initialize request");

        crashIfNot(params.protocolVersion === DEFAULT_PROTOCOL_VERSION, {
          code: INVALID_PARAMS,
          message: "Unsupported protocol version",
          data: {
            supported: [DEFAULT_PROTOCOL_VERSION],
            requested: params.protocolVersion,
          }
        });

        writeLog("Supported protocol");

        const capabilities =
          (await this.contextModel.onListCapabilities?.(contextOptions)) ??
          DEFAULT_CAPABILITIES;

        const serverInfo =
          await this.contextModel.onListInformation(
            contextOptions,
          );

        writeLog("Responsing...");

        await this.transport.response(successResponse<IInitializeResponse["result"]>(
          id,
          {
            protocolVersion: DEFAULT_PROTOCOL_VERSION,
            capabilities,
            serverInfo,
          },
        ));

        break;
      }
      case isInitializedNotification(message): {
        this.contextModel.onConnect?.(contextOptions);
        break;
      }
      case isCancelledNotification(message): {
        const { params } = message;
        this.cancelRequestJob(params.requestId);
        break;
      }
      case isPingRequest(message): {
        await this.transport.response(successResponse<IPingResponse["result"]>(message.id, {}));
        break;
      }
      case isPromptsListRequest(message): {
        const { id, params } = message;
        const prompts = await this.contextModel.onListPrompts?.(contextOptions);

        crashIfNot(prompts, { code: INTERNAL_ERROR, message: "No prompts" });

        if (params) {
          const { cursor } = params;
          const cursorIndex = prompts.findIndex((p) =>
            textToSlug(p.name) === textToSlug(cursor)
          );

          if (cursorIndex !== -1) {
            prompts.splice(0, cursorIndex);
          }
        }

        await this.transport.response(successResponse<IPromptsListResponse["result"]>(id, { prompts }));
        break;
      }
      case isPromptsGetRequest(message): {
        const { id, params } = message;
        const { name: promptName, arguments: promptArgs } = params;
        const prompts = await this.contextModel.onListPrompts?.(contextOptions);

        crashIfNot(prompts, { code: INTERNAL_ERROR, message: "No prompts" });

        const prompt = prompts.find((p) =>
          textToSlug(p.name) === textToSlug(promptName)
        );

        crashIfNot(prompt, { code: INVALID_PARAMS, message: "No prompt" });

        const promptResponse = await this.contextModel.onGetPrompt?.(
          prompt,
          promptArgs ?? {},
          contextOptions,
        );

        crashIfNot(promptResponse, {
          code: INTERNAL_ERROR,
          message: "No prompt messages",
        });

        await this.transport.response(successResponse<IPromptsGetResponse["result"]>(id, promptResponse));
        break;
      }
      case isToolsListRequest(message): {
        const { id, params } = message;
        const tools = await this.contextModel.onListTools?.(contextOptions);

        crashIfNot(tools, { code: INTERNAL_ERROR, message: "No prompts" });

        if (params) {
          const { cursor } = params;
          const cursorIndex = tools.findIndex((p) =>
            textToSlug(p.name) === textToSlug(cursor)
          );

          if (cursorIndex !== -1) {
            tools.splice(0, cursorIndex);
          }
        }

        await this.transport.response(successResponse<IToolsListResponse["result"]>(id, { tools }));
        break;
      }
      case isToolsCallRequest(message): {
        const { id, params } = message;
        const { name: toolName, arguments: toolArgs } = params;
        const tools = await this.contextModel.onListTools?.(contextOptions);

        crashIfNot(tools, { code: INTERNAL_ERROR, message: "No tools" });

        const tool = tools.find((p) => textToSlug(p.name) === textToSlug(toolName));

        crashIfNot(tool, { code: INVALID_PARAMS, message: "No tool" });

        const toolResponse = await this.contextModel.onCallTool?.(
          tool,
          toolArgs ?? {},
          contextOptions,
        );

        crashIfNot(toolResponse, {
          code: INTERNAL_ERROR,
          message: "No tool messages",
        });

        await this.transport.response(successResponse<IToolsCallResponse["result"]>(id, toolResponse));
        break;
      }
      case isCompletionCompleteRequest(message): {
        const { id, params } = message;
        const { ref, argument } = params;
        const completion = await this.contextModel.onGetCompletion?.(
          ref.type === "ref/prompt" ? ContextModelEntityType.PROMPT : ContextModelEntityType.RESOURCE,
          argument,
          contextOptions,
        );

        if (isUndefined(completion)) {
          return this.transport.response(successResponse<ICompletionCompleteResponse["result"]>(id, {
            completion: {
              values: [],
              hasMore: false,
              total: 0
            }
          }));
        }

        completion.values = completion.values
          .sort((a, b) => a.localeCompare(b))
          .splice(0, 100);
        completion.total = completion.values.length;

        await this.transport.response(successResponse<ICompletionCompleteResponse["result"]>(id, { completion }));
        break;
      }
      default: {
        if (isGenericRequest(message)) {
          const { id, method } = message;

          crashIfNot(false, {
            code: INTERNAL_ERROR,
            message: `Invalid request method: ${method}`,
          });
        }
        break;
      }
    }
  }

  public async start() {
    writeLog("Starting transport...");
    await this.transport.onInitialize(this);
  }

  private registerRequestJob(id: RequestId, abortController: AbortController) {
    this.jobs.set(id, abortController);
  }

  private unregisterRequestJob(id: RequestId) {
    this.jobs.delete(id);
  }

  private cancelRequestJob(id: RequestId) {
    this.jobs.get(id)?.abort();
    this.jobs.delete(id);
  }
}

class CustomContext implements IContextModel {
  async onListInformation(options: IContextModelOptions) {
    return {
      name: "EasyMCP Mock Server",
      version: "0.1.0-mock",
    };
  }

  async onListCapabilities(options: IContextModelOptions) {
    return DEFAULT_CAPABILITIES;
  }

  async onConnect(options: IContextModelOptions): Promise<void> {
    // console.log("MCP client connected and initialized.");
  }

  async onListPrompts(options: IContextModelOptions): Promise<IPrompt[]> {
    return [{
      name: "Generate Greeting",
      description: "Generates a simple greeting message.",
      arguments: [{
        name: "name",
        description: "The name of the person to greet.",
        required: true,
      }],
    }];
  }

  async onGetPrompt(
    prompt: IPrompt,
    args: Record<string, unknown>,
    options: IContextModelOptions,
  ): Promise<IPromptsGetResponse["result"]> {
    if (prompt.name === "Generate Greeting") {
      const name = args.name as string ?? "World";
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Generate a greeting for ${name}.`,
          },
        }, {
          role: "assistant",
          content: {
            type: "text",
            text: `Hello, ${name}! Welcome to the EasyMCP mock environment.`,
          },
        }],
        description: ""
      };
    }

    return { messages: [], description: "" };
  }

  onGetCompletion(): Promise<ICompletionCompleteResponse["result"]["completion"]> {
    throw new Error("Not implemented");
  }
}

const contextModel = new CustomContext();
const transport = new StdioTransport();

writeLog("################################################################");
writeLog("EasyMCP mock server starting...");

const server = new EasyMCPServer(transport, contextModel, {
  timeout: Number(Deno.env.get("TIMEOUT")!),
});

writeLog("Server configured...");

server.start();
