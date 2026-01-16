import { RequestId } from "../types/mod.ts";
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

/**
 * https://modelcontextprotocol.io/specification/2024-11-05/basic/utilities/cancellation
 */
export interface ICancelledNotification extends IGenericNotification {
  method: "notifications/cancelled";
  params: {
    requestId: RequestId;
    rason?: string;
  };
}

export interface IProgressNotification extends IGenericNotification {
  method: "notifications/progress";
  params: {
    progressToken: RequestId;
    progress: number;
    total?: number;
  };
}