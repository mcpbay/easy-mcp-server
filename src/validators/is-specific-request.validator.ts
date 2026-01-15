import { ProtocolMessage } from "../enums/mod.ts";
import { isGenericRequest } from "./is-generic-request.validator.ts";

export function isSpecificRequest<T>(
  value: unknown,
  method: ProtocolMessage,
): value is T {
  return isGenericRequest(value) && value.method === method;
}
