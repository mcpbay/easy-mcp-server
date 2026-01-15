import type {
  IGenericProtocolResponse,
  IProtocolErrorResponse,
} from "../interfaces/mod.ts";

export function successResponse<T extends object>(
  id: number,
  result: T,
): IGenericProtocolResponse<T> {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

export function errorResponse<T>(
  id: number,
  error: IProtocolErrorResponse<T>["error"],
): IProtocolErrorResponse<T> {
  return {
    jsonrpc: "2.0",
    id,
    error,
  };
}
