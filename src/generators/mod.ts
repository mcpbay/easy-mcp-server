import { LogLevel, ProtocolNotification } from "../enums/mod.ts";
import type {
  IGenericProtocolResponse,
  IProgressNotification,
  IProtocolErrorResponse,
} from "../interfaces/mod.ts";
import type { RequestId } from "../types/mod.ts";

export function promptsListChangedNotification() {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.PROMPTS_LIST_CHANGED,
  };
}

export function resourcesListChangedNotification() {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.RESOURCES_LIST_CHANGED,
  };
}

export function resourcesUpdatedNotification(uri: string) {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.RESOURCES_UPDATED,
    params: { uri }
  };
}

export function toolsListChangedNotification() {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.TOOLS_LIST_CHANGED,
  };
}

export function loggingNotification(logLevel: LogLevel, data: unknown, logger?: string) {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.MESSAGE,
    params: {
      level: logLevel,
      logger,
      data
    },
  };
}

export function progressNotification(
  progressToken: RequestId,
  value: number,
  total?: number
): IProgressNotification {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.PROGRESS,
    params: {
      progressToken,
      progress: value,
      total,
    },
  };
}

export function successResponse<T extends object>(
  id: RequestId,
  result: T,
): IGenericProtocolResponse<T> {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

export function errorResponse<T>(
  id: RequestId,
  error: IProtocolErrorResponse<T>["error"],
): IProtocolErrorResponse<T> {
  return {
    jsonrpc: "2.0",
    id,
    error,
  };
}
