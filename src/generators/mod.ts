import {
  type LogLevel,
  ProtocolMessage,
  ProtocolNotification,
} from "../enums/mod.ts";
import type {
  IGenericProtocolResponse,
  IProgressNotification,
  IProtocolErrorResponse,
  ISamplingCreateMessageRequest,
  ITaskState,
} from "../interfaces/mod.ts";
import type { RequestId } from "../types/mod.ts";

export function elicitationCreateRequest(
  id: RequestId,
  message: string,
  schema: object,
) {
  return {
    jsonrpc: "2.0",
    id,
    method: ProtocolMessage.ELICITATION_CREATE,
    params: { message, requestedSchema: schema },
  };
}

export function samplingCreateMessageRequest(
  id: RequestId,
  params: ISamplingCreateMessageRequest["params"],
) {
  return {
    jsonrpc: "2.0",
    id,
    method: ProtocolMessage.SAMPLING_CREATE_MESSAGE,
    params,
  } satisfies ISamplingCreateMessageRequest;
}

export function rootsListRequest(id: RequestId) {
  return {
    jsonrpc: "2.0",
    id,
    method: ProtocolMessage.ROOTS_LIST,
  };
}

export function elicitationCompleteNotification(elicitationId: string) {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.ELICITATION_COMPLETE,
    params: { elicitationId },
  };
}

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

export function tasksStatusNotification(taskState: ITaskState) {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.TASKS_STATUS,
    params: taskState,
  };
}

export function resourcesUpdatedNotification(uri: string) {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.RESOURCES_UPDATED,
    params: { uri },
  };
}

export function toolsListChangedNotification() {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.TOOLS_LIST_CHANGED,
  };
}

export function loggingNotification(
  logLevel: LogLevel,
  data: unknown,
  logger?: string,
) {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.MESSAGE,
    params: {
      level: logLevel,
      logger,
      data,
    },
  };
}

export function progressNotification(
  progressToken: RequestId,
  value: number,
  total?: number,
  message?: string,
): IProgressNotification {
  return {
    jsonrpc: "2.0",
    method: ProtocolNotification.PROGRESS,
    params: {
      progressToken,
      progress: value,
      total,
      message,
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
