import type { IClientMinimalRequestStructure } from "./common.ts";

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptsListChangedNotification extends Omit<IClientMinimalRequestStructure, 'id'> {
  method: "notifications/prompts/list_changed";
}