/// <reference lib="deno.ns" />
import { getStringUid } from "@online/get-string-uid";
import { isUndefined } from "@online/is";
import { Transport } from "./src/abstractions/mod.ts";
import { INTERNAL_ERROR, INVALID_PARAMS, METHOD_NOT_FOUND } from "./src/constants/mod.ts";
import { RequestException } from "./src/exceptions/mod.ts";
import {
  errorResponse,
  loggingNotification,
  progressNotification,
  promptsListChangedNotification,
  resourcesListChangedNotification,
  resourcesUpdatedNotification,
  rootsListRequest,
  samplingCreateMessageRequest,
  successResponse,
  toolsListChangedNotification,
} from "./src/generators/mod.ts";
import type {
  ICapabilities,
  IClientMinimalRequestStructure,
  ICompletionCompleteResponse,
  ICompletionMessageResponse,
  IContextModel,
  IContextModelOptions,
  IGenericRequest,
  IInitializeResponse,
  ILoggingSetLevelResponse,
  ILogOptions,
  IPingResponse,
  IProgressOptions,
  IPrompt,
  IPromptsGetResponse,
  IPromptsListResponse,
  IRequestParamsMetadata,
  IResourcesListResponse,
  IResourcesReadResponse,
  IResourcesSubscribeResponse,
  IRoot,
  IRootsListResponse,
  IToolsCallResponse,
  IToolsListResponse,
  LogFunction,
} from "./src/interfaces/mod.ts";
import { StdioTransport } from "./src/transports/mod.ts";
import type { IMessageHandlerClass, RequestId } from "./src/types/mod.ts";
import { crashIfNot, textToSlug } from "./src/utils/mod.ts";
import {
  isCancelledNotification,
  isCompletionCompleteRequest,
  isGenericRequest,
  isGenericResultResponse,
  isInitializedNotification,
  isInitializeRequest,
  isLoggingSetLevelRequest,
  isPingRequest,
  isPromptsGetRequest,
  isPromptsListRequest,
  isResourcesListRequest,
  isResourcesReadRequest,
  isResourcesSubscribeRequest,
  isRootsListChangedNotification,
  isToolsCallRequest,
  isToolsListRequest,
} from "./src/validators/mod.ts";
import { ContextModelEntityType, LogLevel } from "./src/enums/mod.ts";
import fs from "node:fs";

function writeLog(line: string) {
  const todayDateString = new Date().toISOString().split("T")[0];

  Deno.writeTextFileSync(
    `E:/Git/profit/node/mcpbay/easymcp/logs/${todayDateString}.log`,
    `${line}\n`,
    { append: true },
  );
}

const LOG_LEVELS: LogLevel[] = [
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.NOTICE,
  LogLevel.WARNING,
  LogLevel.ERROR,
  LogLevel.CRITICAL,
  LogLevel.ALERT,
  LogLevel.EMERGENCY,
];

type ProtocolVersion = "2024-11-05" | "2025-03-26" | "2025-06-18";

const SUPPORTED_PROTOCOL_VERSIONS: readonly ProtocolVersion[] = Object.freeze<ProtocolVersion[]>([
  "2024-11-05",
  "2025-03-26",
  "2025-06-18"
]);
const DEFAULT_PROTOCOL_VERSION: ProtocolVersion = "2025-06-18" as const;
const DEFAULT_CAPABILITIES: ICapabilities = Object.freeze<ICapabilities>({
  completions: { listChanged: false },
  prompts: { listChanged: true },
  resources: { listChanged: true, subscribe: true },
  tools: { listChanged: true },
  roots: { listChanged: false },
  sampling: {},
  logging: {},
} as const);

export interface IEasyMCPConfig {
  protocol: ProtocolVersion;
  timeout: number;
  completionAttemptTimeout: number;
  server: Partial<{
    sendToolsListChangedNotification: boolean;
    sendPromptsListChangedNotification: boolean;
    sendResourcesListChangedNotification: boolean;
    sendResourcesUpdatedNotification: boolean;
    allowClientSubscribeToIndividualResourceUpdate: boolean;
    sendLogs: boolean;
    logsFilePath: string;
    supportsCompletion: boolean;
  }>;
}

enum DeeferedPromiseType {
  COMPLETION = "completion",
  ROOTING = "rooting",
}

export class EasyMCPServer implements IMessageHandlerClass {
  private readonly jobs: Map<RequestId, AbortController> = new Map();
  private logLevel: LogLevel | undefined;
  private readonly resourceSubscriptions = new Set<string>();
  private readonly capabilities: ICapabilities = DEFAULT_CAPABILITIES;
  private readonly isCommuncationInitialized = false;
  private uniqueId = 1;
  private readonly defeeredPromises = new Map<RequestId, {
    type: DeeferedPromiseType;
    resolve:
    | ((value: ICompletionMessageResponse["result"]) => void)
    | ((value: IRootsListResponse["result"]["roots"]) => void);
    reject: (reason?: any) => void;
  }>();
  private protocolVersion: ProtocolVersion = DEFAULT_PROTOCOL_VERSION;

  constructor(
    private readonly transport: Transport,
    private readonly contextModel: IContextModel,
    private readonly config?: Partial<IEasyMCPConfig>,
  ) {
    this.protocolVersion = config?.protocol ?? DEFAULT_PROTOCOL_VERSION;
    Object.assign(this, {
      capabilities: {
        completions: config?.server?.supportsCompletion ? {} : void 0,
        prompts: {
          listChanged: config?.server?.sendPromptsListChangedNotification ??
            true,
        },
        resources: {
          listChanged: config?.server?.sendResourcesListChangedNotification ??
            true,
          subscribe:
            config?.server?.allowClientSubscribeToIndividualResourceUpdate ??
            true,
        },
        tools: {
          listChanged: config?.server?.sendToolsListChangedNotification ?? true,
        },
        roots: { listChanged: false },
        sampling: {},
        logging: (config?.server?.sendLogs ?? true) ? {} : void 0,
      } satisfies ICapabilities,
    });
  }

  // A wrapper to set the `AbortController` on every `ContextModel` event.
  async messageHandler(message: object) {
    const abortController = new AbortController();
    const possibleId: RequestId | undefined =
      (message as IClientMinimalRequestStructure)?.id;

    writeLog("Before SetTimeout...");

    setTimeout(
      () => {
        abortController.abort();
      },
      this.config?.timeout || 10000,
    );

    writeLog("After SetTimeout...");

    abortController.signal.addEventListener("abort", () => {
      if (!possibleId) {
        return;
      }

      this.transport.send(errorResponse(possibleId, {
        code: INTERNAL_ERROR,
        message: "Request timed out",
      }));
    });

    writeLog("Executing messageHandler...");

    const isCancellableRequest = isGenericRequest(message) &&
      !isInitializeRequest(message);

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

        this.transport.send(errorResponse(possibleId, {
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

  private loggerFactory(logLevel: LogLevel) {
    return (message: string, options?: Partial<ILogOptions>) => {
      if (
        isUndefined(this.logLevel) || !this.capabilities.logging ||
        LOG_LEVELS.indexOf(logLevel) > LOG_LEVELS.indexOf(this.logLevel)
      ) {
        return;
      }

      if (this.config?.server?.logsFilePath) {
        const paddedLogLevel = logLevel.padEnd(10, " ");

        fs.appendFileSync(
          this.config?.server?.logsFilePath,
          `${paddedLogLevel} ${message}\n`,
        );
      }

      this.transport.send(
        loggingNotification(
          logLevel,
          { message, details: options?.details },
          options?.logger,
        ),
      );
    };
  }

  private async internalMessageHandler(
    message: object,
    abortController: AbortController,
  ) {
    const contextOptions: IContextModelOptions = {
      abortController,
      progress: async (
        value: number,
        options: Partial<IProgressOptions> = {},
      ) => {
        const { total = 1, message: progressMessage } = options;
        const progressToken =
          ((message as IGenericRequest).params as IRequestParamsMetadata)._meta
            ?.progressToken;

        crashIfNot(value >= 0 && value <= total, {
          code: INVALID_PARAMS,
          message: `Progress value must be between 0 and ${total}`,
        });

        // if (!isUndefined(total)) {
        //   crashIfNot(total > 0 && total <= 1, {
        //     code: INVALID_PARAMS,
        //     message: "Progress total must be between 0 and 1",
        //   });
        // }

        if (!progressToken) {
          return;
        }

        await this.transport.send(
          progressNotification(progressToken, value, total, progressMessage),
        );
      },
      log: Object.fromEntries(
        Object
          .values(LogLevel)
          .map(
            (level) => [level, this.loggerFactory(level)],
          ),
      ) as Record<LogLevel, LogFunction>,
      notify: {
        promptsListChanged: () => {
          crashIfNot(this.capabilities.prompts.listChanged, {
            code: INTERNAL_ERROR,
            message:
              "'sendPromptsListChangedNotification' server option is not enabled",
          });

          this.transport.send(promptsListChangedNotification());
        },
        resourceUpdated: (uri: string) => {
          crashIfNot(this.capabilities.resources.subscribe, {
            code: INTERNAL_ERROR,
            message:
              "'sendResourcesUpdatedNotification' server option is not enabled",
          });

          crashIfNot(this.resourceSubscriptions.has(uri), {
            code: INVALID_PARAMS,
            message: `Resource '${uri}' does not exist`,
          });

          this.transport.send(resourcesUpdatedNotification(uri));
        },
        resourcesListChanged: () => {
          crashIfNot(this.capabilities.resources.listChanged, {
            code: INTERNAL_ERROR,
            message:
              "'sendResourcesListChangedNotification' server option is not enabled",
          });

          this.transport.send(resourcesListChangedNotification());
        },
        toolsListChanged: () => {
          crashIfNot(this.capabilities.tools.listChanged, {
            code: INTERNAL_ERROR,
            message:
              "'sendToolsListChangedNotification' server option is not enabled",
          });

          this.transport.send(toolsListChangedNotification());
        },
      },
      createCompletion: (messages, options = { maxTokens: 100 }) => {
        crashIfNot(this.capabilities.sampling, {
          code: INTERNAL_ERROR,
          message: "Sampling capability is not enabled",
        });

        const uniqueId = this.getUniqueId();

        this.transport.send(samplingCreateMessageRequest(uniqueId, {
          messages,
          ...options,
        }));

        const resultPromise = new Promise<ICompletionMessageResponse["result"]>(
          (resolve, reject) => {
            this.defeeredPromises.set(uniqueId, {
              type: DeeferedPromiseType.COMPLETION,
              resolve,
              reject,
            });

            setTimeout(
              () =>
                reject(
                  new RequestException("Request timed out", INTERNAL_ERROR),
                ),
              this.config?.completionAttemptTimeout || 10000,
            );
          },
        );

        return resultPromise.finally(() =>
          this.defeeredPromises.delete(uniqueId)
        );
      },
      getClientRootsList: () => {
        const uniqueId = this.getUniqueId();

        this.transport.send(rootsListRequest(uniqueId));

        const resultPromise = new Promise<
          IRootsListResponse["result"]["roots"]
        >(
          (resolve, reject) => {
            this.defeeredPromises.set(uniqueId, {
              type: DeeferedPromiseType.COMPLETION,
              resolve,
              reject,
            });

            setTimeout(
              () =>
                reject(
                  new RequestException("Request timed out", INTERNAL_ERROR),
                ),
              this.config?.completionAttemptTimeout || 10000,
            );
          },
        );

        return resultPromise.finally(() =>
          this.defeeredPromises.delete(uniqueId)
        );
      },
    };

    writeLog("Message handler of: " + JSON.stringify(message));

    switch (true) {
      case isInitializeRequest(message): {
        const { id, params } = message;
        const requestedProtocolVersion = params.protocolVersion as ProtocolVersion;

        writeLog("Initialize request");

        crashIfNot(SUPPORTED_PROTOCOL_VERSIONS.includes(requestedProtocolVersion), {
          code: INVALID_PARAMS,
          message: "Unsupported protocol version requested",
          data: {
            supported: SUPPORTED_PROTOCOL_VERSIONS,
            requested: requestedProtocolVersion,
          },
        });

        writeLog(`Using protocol version: ${requestedProtocolVersion}`);
        this.setProtocolVersion(requestedProtocolVersion);

        const capabilities =
          (await this.contextModel.onClientListCapabilities?.(
            contextOptions,
          )) ??
          this.capabilities;

        const serverInfo =
          await this.contextModel.onClientListInformation(contextOptions);

        writeLog("Responsing...");

        this.setCapabilities(capabilities);
        await this.transport.send(
          successResponse<IInitializeResponse["result"]>(
            id,
            {
              protocolVersion: this.protocolVersion,
              capabilities,
              serverInfo,
            },
          ),
        );
        break;
      }
      case isInitializedNotification(message): {
        this.initializeCommunication();
        await this.contextModel.onClientConnect?.(contextOptions);
        break;
      }
      case isCancelledNotification(message): {
        const { params } = message;
        this.cancelRequestJob(params.requestId);
        break;
      }
      case isPingRequest(message): {
        await this.transport.send(
          successResponse<IPingResponse["result"]>(message.id, {}),
        );
        break;
      }
      case isPromptsListRequest(message): {
        const { id, params } = message;
        const prompts = await this.contextModel.onClientListPrompts?.(
          contextOptions,
        );

        crashIfNot(prompts, { code: INTERNAL_ERROR, message: "No prompts" });

        if (params) {
          const { cursor } = params;
          const cursorIndex = prompts.findIndex((p) =>
            String(getStringUid(p.name)) === cursor
          );

          if (cursorIndex !== -1) {
            prompts.splice(cursorIndex, cursorIndex + 100);
          }
        }

        await this.transport.send(
          successResponse<IPromptsListResponse["result"]>(id, { prompts }),
        );
        break;
      }
      case isPromptsGetRequest(message): {
        const { id, params } = message;
        const { name: promptName, arguments: promptArgs } = params;
        const prompts = await this.contextModel.onClientListPrompts?.(
          contextOptions,
        );

        crashIfNot(prompts, { code: INTERNAL_ERROR, message: "No prompts" });

        const prompt = prompts.find((p) =>
          textToSlug(p.name) === textToSlug(promptName)
        );

        crashIfNot(prompt, { code: INVALID_PARAMS, message: "No prompt" });

        const promptResponse = await this.contextModel.onClientGetPrompt?.(
          prompt,
          promptArgs ?? {},
          contextOptions,
        );

        crashIfNot(promptResponse, {
          code: INTERNAL_ERROR,
          message: "No prompt messages",
        });

        await this.transport.send(
          successResponse<IPromptsGetResponse["result"]>(id, promptResponse),
        );
        break;
      }
      case isToolsListRequest(message): {
        const { id, params } = message;
        const tools = await this.contextModel.onClientListTools?.(
          contextOptions,
        );

        crashIfNot(tools, { code: INTERNAL_ERROR, message: "No prompts" });

        if (params) {
          const { cursor } = params;
          const cursorIndex = tools.findIndex((p) =>
            String(getStringUid(p.name)) === cursor
          );

          if (cursorIndex !== -1) {
            tools.splice(cursorIndex, cursorIndex + 100);
          }
        }

        await this.transport.send(
          successResponse<IToolsListResponse["result"]>(id, { tools }),
        );
        break;
      }
      case isToolsCallRequest(message): {
        const { id, params } = message;
        const { name: toolName, arguments: toolArgs } = params;
        const tools = await this.contextModel.onClientListTools?.(
          contextOptions,
        );

        crashIfNot(tools, { code: INTERNAL_ERROR, message: "No tools" });

        const tool = tools.find((p) =>
          textToSlug(p.name) === textToSlug(toolName)
        );

        crashIfNot(tool, { code: INVALID_PARAMS, message: "No tool" });

        const toolResponse = await this.contextModel.onClientCallTool?.(
          tool,
          toolArgs ?? {},
          contextOptions,
        );

        crashIfNot(toolResponse, {
          code: INTERNAL_ERROR,
          message: "No tool messages",
        });

        await this.transport.send(
          successResponse<IToolsCallResponse["result"]>(id, toolResponse),
        );
        break;
      }
      case isCompletionCompleteRequest(message): {
        // Specific case, due the first version of the MCP procol does supports completions requests.
        if (this.protocolVersion !== "2024-11-05") {
          this.requireAtLeastVersion("2025-03-26", "The protocol version is too old to support completions requests.");

          // I do put this here due the protocol version "2024-11-05" does not support capability check for this request
          crashIfNot(this.capabilities.completions, {
            code: METHOD_NOT_FOUND,
            message: "'sendCompletionCompleteRequest' server option is not enabled",
          });
        }

        const { id, params } = message;
        const { ref, argument } = params;
        const completion = await this.contextModel.onClientRequestsCompletion?.(
          ref.type === "ref/prompt"
            ? ContextModelEntityType.PROMPT
            : ContextModelEntityType.RESOURCE,
          argument,
          contextOptions,
        );

        if (isUndefined(completion)) {
          return this.transport.send(
            successResponse<ICompletionCompleteResponse["result"]>(id, {
              completion: {
                values: [],
                hasMore: false,
                total: 0,
              },
            }),
          );
        }

        completion.values = completion.values
          .sort((a, b) => a.localeCompare(b))
          .splice(0, 100);
        completion.total = completion.values.length;

        await this.transport.send(
          successResponse<ICompletionCompleteResponse["result"]>(id, {
            completion,
          }),
        );
        break;
      }
      case isResourcesListRequest(message): {
        const { id, params } = message;
        const resources = await this.contextModel.onClientListResources?.(
          contextOptions,
        );

        crashIfNot(resources, {
          code: INTERNAL_ERROR,
          message: "No resources",
        });

        if (params) {
          const { cursor } = params;
          const cursorIndex = resources.findIndex((p) =>
            String(getStringUid(p.name)) === cursor
          );

          if (cursorIndex !== -1) {
            resources.splice(cursorIndex, cursorIndex + 100);
          }
        }

        await this.transport.send(
          successResponse<IResourcesListResponse["result"]>(id, { resources }),
        );
        break;
      }
      case isResourcesReadRequest(message): {
        const { id, params } = message;
        const { uri } = params;
        const resource = await this.contextModel.onClientReadResource?.(
          uri,
          contextOptions,
        );

        crashIfNot(resource, {
          code: INVALID_PARAMS,
          message: "No resource",
          data: { uri },
        });

        await this.transport.send(
          successResponse<IResourcesReadResponse["result"]>(id, {
            contents: resource,
          }),
        );
        break;
      }
      case isLoggingSetLevelRequest(message): {
        const { id, params } = message;

        crashIfNot(Object.values(LogLevel).includes(params.level), {
          message: "Invalid log level",
          code: INVALID_PARAMS,
        });

        this.setLogLevel(params.level);
        await this.transport.send(
          successResponse<ILoggingSetLevelResponse["result"]>(id, {}),
        );
        break;
      }
      case isResourcesSubscribeRequest(message): {
        const { id, params } = message;
        const { uri } = params;

        this.registerResourceSubscription(uri);
        await this.transport.send(
          successResponse<IResourcesSubscribeResponse["result"]>(id, {}),
        );
        break;
      }
      case isRootsListChangedNotification(message): {
        this.contextModel.onClientRootsChanged?.(contextOptions);
        break;
      }
      case isGenericResultResponse(message): {
        const { id, result } = message;
        const defeeredPromise = this.getDeeferedPromiseById(id);

        crashIfNot(defeeredPromise, {
          code: INTERNAL_ERROR,
          message: `No request found related with id '${id}'`,
        });

        if (defeeredPromise.type === DeeferedPromiseType.COMPLETION) {
          const completion = result as ICompletionMessageResponse["result"];

          // I don't know why I do need to put the `& IRoot[]` here, but it works... a TypeScript bug?
          defeeredPromise.resolve(
            completion as ICompletionMessageResponse["result"] & IRoot[],
          );
        } else if (defeeredPromise.type === DeeferedPromiseType.ROOTING) {
          const { roots } = result as IRootsListResponse["result"];

          // Same thing here...
          defeeredPromise.resolve(
            roots as ICompletionMessageResponse["result"] & IRoot[],
          );
        }

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

  private registerResourceSubscription(uri: string) {
    this.resourceSubscriptions.add(uri);
  }

  private setLogLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  private setProtocolVersion(protocolVersion: ProtocolVersion) {
    this.protocolVersion = protocolVersion;
  }

  private setCapabilities(capabilities: ICapabilities) {
    Object.assign(this, { capabilities });
  }

  private initializeCommunication() {
    Object.assign(this, { isCommuncationInitialized: true });
  }

  private getUniqueId() {
    return this.uniqueId++;
  }

  private getDeeferedPromiseById(id: RequestId) {
    return this.defeeredPromises.get(id);
  }

  private requireAtLeastVersion(protocolVersion: ProtocolVersion, message: string) {
    crashIfNot(
      SUPPORTED_PROTOCOL_VERSIONS.indexOf(this.protocolVersion) < SUPPORTED_PROTOCOL_VERSIONS.indexOf(protocolVersion),
      {
        code: METHOD_NOT_FOUND,
        message,
        data: {
          currentProtocolVersion: this.protocolVersion,
          requiredProtocolVersion: protocolVersion
        },
      },
    );
  }
}

class CustomContext implements IContextModel {
  async onClientListInformation(options: IContextModelOptions) {
    return {
      name: "EasyMCP Mock Server",
      version: "0.1.0-mock",
    };
  }

  async onClientListCapabilities(options: IContextModelOptions) {
    return DEFAULT_CAPABILITIES;
  }

  async onClientConnect(options: IContextModelOptions): Promise<void> {
    // console.log("MCP client connected and initialized.");
  }

  async onClientListPrompts(options: IContextModelOptions): Promise<IPrompt[]> {
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

  async onClientGetPrompt(
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
        description: "",
      };
    }

    return { messages: [], description: "" };
  }

  onClientRequestsCompletion(): Promise<
    ICompletionCompleteResponse["result"]["completion"]
  > {
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
