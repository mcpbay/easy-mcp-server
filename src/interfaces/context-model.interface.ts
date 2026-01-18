import { ContextModelEntityType, LogLevel } from "../enums/mod.ts";
import type {
  ICapabilities,
  IPrompt,
  IResourceContent,
  IRoot,
  ITool,
} from "./entities.ts";
import type {
  ICompletionCompleteRequest,
  IInitializeRequest,
  ISamplingCreateMessageRequest,
  ISamplingMessageContent,
} from "./requests.ts";
import type {
  ICompletionCompleteResponse,
  ICompletionMessageResponse,
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

export type CreateCompletionRequestOptions = Omit<
  ISamplingCreateMessageRequest["params"],
  "messages"
>;

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

  /**
   * Requests a completion from the client.
   * @param messages 
   * @param options 
   */
  createCompletion(
    messages: ISamplingMessageContent[],
    options?: CreateCompletionRequestOptions,
  ): Promise<ICompletionMessageResponse["result"]>;
  /**
   * Requests the list of roots from the client.
   */
  getClientRootsList(): Promise<IRoot[]>;
}

export interface IContextModel {
  onClientListInformation(
    options: IContextModelOptions,
  ): Promise<IInitializeRequest["params"]["clientInfo"]>;

  /**
   * Use this method to override the server capabilities.
   * Do not use this if you don't know what you are doing.
   */
  onClientListCapabilities?(options: IContextModelOptions): Promise<ICapabilities>;

  onClientListPrompts?(options: IContextModelOptions): Promise<IPrompt[]>;

  onClientGetPrompt?(
    promt: IPrompt,
    args: Record<string, unknown>,
    options: IContextModelOptions,
  ): Promise<IPromptsGetResponse["result"]>;

  onClientListTools?(options: IContextModelOptions): Promise<ITool[]>;

  onClientCallTool?(
    tool: ITool,
    args: Record<string, unknown>,
    options: IContextModelOptions,
  ): Promise<IToolsCallResponse["result"]>;

  onClientListResources?(
    options: IContextModelOptions,
  ): Promise<IResourcesListResponse["result"]["resources"]>;

  onClientReadResource?(
    resourceUri: string,
    options: IContextModelOptions,
  ): Promise<IResourceContent[]>;

  onClientRequestsCompletion?(
    entityType: ContextModelEntityType,
    args: ICompletionCompleteRequest["params"]["argument"],
    options: IContextModelOptions,
  ): Promise<ICompletionCompleteResponse["result"]["completion"]>;

  onClientConnect?(options: IContextModelOptions): Promise<void>;
  /**
   * Called when client notifies roots changed on its side.
   */
  onClientRootsChanged?(options: IContextModelOptions): Promise<void>;
}
