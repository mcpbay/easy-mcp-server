/// <reference lib="deno.ns" />
import { ContextModel, Transport } from "./src/abstractions/mod.ts";
import { INTERNAL_ERROR, INVALID_PARAMS } from "./src/constants/mod.ts";
import { RequestException } from "./src/exceptions/mod.ts";
import { errorResponse, successResponse } from "./src/generators/mod.ts";
import {
  ICapabilities,
  IClientMinimalRequestStructure,
  IInitializeResponse,
} from "./src/interfaces/mod.ts";
import { StdioTransport } from "./src/transports/mod.ts";
import { crashIfNot, textToSlug } from "./src/utils/mod.ts";
import {
  isGenericRequest,
  isInitializedNotification,
  isInitializeRequest,
  isPromptsGetRequest,
  isPromptsListRequest,
} from "./src/validators/mod.ts";

const DEFAULT_PROTOCOL_VERSION = "2024-11-05" as const;
const DEFAULT_CAPABILITIES: ICapabilities = {
  completions: { listChanged: false },
  prompts: { listChanged: false },
  resources: { listChanged: false },
  tools: { listChanged: false },
} as const;

export interface IEasyMCPConfig {
  timeout: number;
}

export class EasyMCPServer {
  constructor(
    private readonly transport: Transport,
    private readonly contextModel: ContextModel,
    private readonly config?: Partial<IEasyMCPConfig>,
  ) { }

  // A wrapper to set the `AbortController` on every `ContextModel` event.
  private async messageHandlerWrapper(message: object) {
    const abortController = new AbortController();
    const possibleId: number | undefined =
      (message as IClientMinimalRequestStructure)?.id;

    setTimeout(
      () => void abortController.abort(),
      this.config?.timeout || 10000,
    );

    abortController.signal.addEventListener("abort", () => {
      if (!possibleId) {
        return;
      }

      this.transport.response(errorResponse(possibleId, {
        code: INTERNAL_ERROR,
        message: "Request timed out",
      }));
    });

    try {
      await this.messageHandler(message, abortController);
    } catch (e) {
      console.error(e);

      if (e instanceof RequestException) {
        if (!possibleId) {
          return;
        }

        this.transport.response(errorResponse(possibleId, {
          code: e.status,
          message: e.message,
        }));
      }
    }
  }

  private async messageHandler(
    message: object,
    abortController: AbortController,
  ) {
    switch (true) {
      case isInitializeRequest(message): {
        const { id, params } = message;

        crashIfNot(params.protocolVersion === DEFAULT_PROTOCOL_VERSION, {
          code: INVALID_PARAMS,
          message: "Unsupported protocol version",
          data: {
            supported: [DEFAULT_PROTOCOL_VERSION],
            requested: params.protocolVersion,
          }
        });

        const capabilities =
          (await this.contextModel.onGetCapabilities?.(abortController)) ??
          DEFAULT_CAPABILITIES;

        const serverInfo =
          await this.contextModel.onGetInformation(
            abortController,
          );

        this.transport.response(successResponse(
          id,
          {
            protocolVersion: DEFAULT_PROTOCOL_VERSION,
            capabilities,
            serverInfo,
          } satisfies IInitializeResponse["result"],
        ));

        break;
      }
      case isInitializedNotification(message): {
        this.contextModel.onConnect?.(abortController);
        break;
      }
      case isPromptsListRequest(message): {
        const { id, params } = message;
        const prompts = await this.contextModel.onGetPrompts?.(abortController);

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

        this.transport.response(successResponse(id, prompts));
        break;
      }
      case isPromptsGetRequest(message): {
        const { id, params } = message;
        const { name: promptName, arguments: promptArgs } = params;
        const prompts = await this.contextModel.onGetPrompts?.(abortController);

        crashIfNot(prompts, { code: INTERNAL_ERROR, message: "No prompts" });

        const prompt = prompts.find((p) =>
          textToSlug(p.name) === textToSlug(promptName)
        );

        crashIfNot(prompt, { code: INVALID_PARAMS, message: "No prompt" });

        const promptResponse = await this.contextModel.onGetPrompt?.(
          prompt,
          promptArgs ?? {},
          abortController,
        );

        crashIfNot(promptResponse, {
          code: INTERNAL_ERROR,
          message: "No prompt messages",
        });

        this.transport.response({ id, result: promptResponse });
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
    await this.transport.onInitialize(this.messageHandlerWrapper);
  }
}

class CustomContext implements ContextModel {
  async onGetInformation(abortController: AbortController) {
    return {
      name: "Deno",
      version: "1.0.0",
    };
  }
}

const contextModel = new CustomContext();
const transport = new StdioTransport();

const server = new EasyMCPServer(transport, contextModel, {
  timeout: Number(Deno.env.get("TIMEOUT")!),
});

await server.start();
