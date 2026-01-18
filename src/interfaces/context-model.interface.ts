import { ContextModelEntityType, LogLevel } from "../enums/mod.ts";
import {
  ICapabilities,
  IPrompt,
  IPromptMessage,
  IPromptMessageResourceContent,
  IResourceContent,
  ITool,
} from "./entities.ts";
import { ICompletionCompleteRequest, IInitializeRequest } from "./requests.ts";
import {
  ICompletionCompleteResponse,
  IPromptsGetResponse,
  IResourcesListResponse,
  IToolsCallResponse,
} from "./responses.ts";

export interface ILogOptions {
  /**
   * Logger name, use it to identify the section is generating the log.
   */
  logger: string;
  /**
   * Additional details to include in the log.
   */
  details: Record<string, unknown>;
}

export interface INotifiy {
  /**
   * Notifies the client about a change in the prompts list.
   */
  promptsListChanged(): void;
  /**
   * Notifies the client about a change in the tools list.
   */
  toolsListChanged(): void;
  /**
   * Notifies the client about a change in the resources list.
   */
  resourcesListChanged(): void;
  /**
   * Notifies the client about a change in a specific resource.
   */
  resourceUpdated(uri: string): void;
}

export type LogFunction = (
  message: string,
  options?: Partial<ILogOptions>,
) => void;

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
  log: Record<LogLevel, LogFunction>;
  notify: INotifiy;
}

export interface IContextModel {
  onListInformation(
    options: IContextModelOptions,
  ): Promise<IInitializeRequest["params"]["clientInfo"]>;

  /**
   * Use this method to override the server capabilities.
   * Do not use this if you don't know what you are doing.
   */
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
  ): Promise<IResourcesListResponse["result"]["resources"]>;

  onReadResource?(
    resourceUri: string,
    options: IContextModelOptions,
  ): Promise<IResourceContent[]>;

  onGetCompletion?(
    entityType: ContextModelEntityType,
    args: ICompletionCompleteRequest["params"]["argument"],
    options: IContextModelOptions,
  ): Promise<ICompletionCompleteResponse["result"]["completion"]>;

  onConnect?(options: IContextModelOptions): Promise<void>;
}
