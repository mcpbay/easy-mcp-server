import type { ICapabilities, IPrompt, IPromptMessage } from "../interfaces/mod.ts";

export abstract class ContextModel {
  abstract onGetCapabilities?(): Promise<ICapabilities>;
  abstract onGetPrompts?(): Promise<IPrompt[]>;
  abstract onGetPrompt?(promt: IPrompt, args: Record<string, unknown>): Promise<IPromptMessage[]>;
}