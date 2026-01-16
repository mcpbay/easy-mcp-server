import type {
  ICapabilities,
  IInitializeRequest,
  IPrompt,
  IPromptMessage,
} from "./mod.ts";

export interface IContextModelOptions {
  abortController: AbortController;
  notify(message: object): Promise<void>;
}

export interface IContextModel {
  onGetInformation(
    options: IContextModelOptions
  ): Promise<IInitializeRequest["params"]["clientInfo"]>;
  onGetCapabilities?(options: IContextModelOptions): Promise<ICapabilities>;
  onGetPrompts?(options: IContextModelOptions): Promise<IPrompt[]>;
  onGetPrompt?(
    promt: IPrompt,
    args: Record<string, unknown>,
    options: IContextModelOptions,
  ): Promise<IPromptMessage[]>;
  onConnect?(options: IContextModelOptions): Promise<void>;
}
