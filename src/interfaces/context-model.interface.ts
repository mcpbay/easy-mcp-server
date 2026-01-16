import { ICapabilities, IPrompt, IPromptMessage, ITool } from "./entities.ts";
import { ICompletionCompleteRequest, IInitializeRequest } from "./requests.ts";
import { ICompletionCompleteResponse, IPromptsGetResponse, IResourcesListResponse, IToolsCallResponse } from "./responses.ts";

export interface IContextModelOptions {
  /**
   * The abort controller to use for the current request.
   * It enables cancelling the request if needed.
   */
  abortController: AbortController;
  /**
   * Sends a progress notification to the client.
   * If the client didn't request progress tracking, this will do nothing.
   * @param value The current progress, must be between 0 and 1
   * @param total The total progress, must be between 0 and 1
   * @returns nothing
   */
  progress(value: number, total?: number): Promise<void>;
}

export enum ContextModelEntityType {
  PROMPT = "prompt",
  TOOL = "tool",
  RESOURCE = "resource",
}

export interface IContextModel {
  onListInformation(
    options: IContextModelOptions
  ): Promise<IInitializeRequest["params"]["clientInfo"]>;

  onListCapabilities?(options: IContextModelOptions): Promise<ICapabilities>;

  onListPrompts?(options: IContextModelOptions): Promise<IPrompt[]>;

  onGetPrompt?(
    promt: IPrompt,
    args: Record<string, unknown>,
    options: IContextModelOptions,
  ): Promise<IPromptsGetResponse["result"]>;

  onListTools?(options: IContextModelOptions): Promise<ITool[]>;

  onCallTool?(
    tool: ITool,
    args: Record<string, unknown>,
    options: IContextModelOptions,
  ): Promise<IToolsCallResponse["result"]>;

  onListResources?(
    options: IContextModelOptions,
  ): Promise<IResourcesListResponse["result"]>;

  onGetCompletion?(entityType: ContextModelEntityType, args: ICompletionCompleteRequest["params"]["argument"], options: IContextModelOptions): Promise<ICompletionCompleteResponse["result"]["completion"]>;

  onConnect?(options: IContextModelOptions): Promise<void>;
}
