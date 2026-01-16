import type {
  IGenericProtocolResponse,
  IProtocolErrorResponse,
} from "../interfaces/mod.ts";
import type { RequestId } from "../types/mod.ts";

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
