/// <reference lib="deno.ns" />
import { ContextModel, Transport } from "./src/abstractions/mod.ts";
import { INTERNAL_ERROR, INVALID_PARAMS } from "./src/constants/mod.ts";
import { errorResponse, successResponse } from "./src/generators/mod.ts";
import { textToSlug } from "./src/utils/mod.ts";
import { isGenericRequest, isPromptsGetRequest, isPromptsListRequest } from "./src/validators/mod.ts";

export class EasyMCPServer {
  constructor(
    private readonly transport: Transport,
    private readonly contextModel: ContextModel,
  ) { }

  private async messageHandler(message: object) {
    switch (true) {
      case isPromptsListRequest(message): {
        const { id, params } = message;
        const prompts = await this.contextModel.onGetPrompts?.();

        if (!prompts) {
          return this.transport.response(errorResponse(id, {
            code: INTERNAL_ERROR,
            message: "No prompts",
          }));
        }

        if (params) {
          const { cursor } = params;
          const cursorIndex = prompts.findIndex((p) => textToSlug(p.name) === textToSlug(cursor));

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
        const prompts = await this.contextModel.onGetPrompts?.();

        if (!prompts) {
          return this.transport.response(errorResponse(id, {
            code: INTERNAL_ERROR,
            message: "No prompts",
          }));
        }

        const prompt = prompts.find((p) => textToSlug(p.name) === textToSlug(promptName));

        if (!prompt) {
          return this.transport.response(errorResponse(id, {
            code: INVALID_PARAMS,
            message: "No prompt",
          }));
        }

        const promptResponse =
          await this.contextModel.onGetPrompt?.(prompt, promptArgs ?? {});

        if (!promptResponse) {
          return this.transport.response(errorResponse(id, {
            code: INTERNAL_ERROR,
            message: "No prompt messages",
          }));
        }

        this.transport.response({ id, result: promptResponse });
        break;
      }
      default: {
        if (isGenericRequest(message)) {
          const { id, method } = message;

          this.transport.response(errorResponse(id, {
            code: INTERNAL_ERROR,
            message: `Invalid request method: ${method}`,
          }));
        }
        break;
      }
    }
  }

  public start() {
    this.transport.onInitialize(this.messageHandler);
  }
}
