import type {
  IClientMinimalRequestStructure,
  IGenericNotification,
} from "./common.ts";

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptsListChangedNotification extends IGenericNotification {
  method: "notifications/prompts/list_changed";
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/basic/lifecycle/#initialization
 */
export interface IInitializedNotification extends IGenericNotification {
  method: "notifications/initialized";
}
