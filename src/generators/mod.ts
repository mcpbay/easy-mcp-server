import type {
  IGenericProtocolResponse,
  IProgressNotification,
  IProtocolErrorResponse,
} from "../interfaces/mod.ts";
import type { RequestId } from "../types/mod.ts";

export function progressNotification(
  progressToken: RequestId,
  value: number,
  total?: number
): IProgressNotification {
  return {
    jsonrpc: "2.0",
    method: "notifications/progress",
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
