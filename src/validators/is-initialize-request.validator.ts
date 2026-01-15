import { ProtocolMessage } from "../enums/mod.ts";
import { IInitializeRequest } from "../interfaces/mod.ts";
import { isSpecificRequest } from "./is-specific-request.validator.ts";

export function isInitializeRequest(value: unknown) {
  return isSpecificRequest<IInitializeRequest>(
    value,
    ProtocolMessage.INITIALIZE,
  );
}
