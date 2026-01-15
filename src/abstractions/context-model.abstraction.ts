import type {
  ICapabilities,
  IInitializeRequest,
  IPrompt,
  IPromptMessage,
} from "../interfaces/mod.ts";

export interface ContextModel {
  onGetInformation(
    abortController: AbortController,
  ): Promise<IInitializeRequest["params"]["clientInfo"]>;
  onGetCapabilities?(abortController: AbortController): Promise<ICapabilities>;
  onGetPrompts?(abortController: AbortController): Promise<IPrompt[]>;
  onGetPrompt?(
    promt: IPrompt,
    args: Record<string, unknown>,
    abortController: AbortController,
  ): Promise<IPromptMessage[]>;
  onConnect?(abortController: AbortController): Promise<void>;
}
