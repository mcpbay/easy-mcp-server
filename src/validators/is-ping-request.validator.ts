import { ProtocolMessage } from "../enums/mod.ts";
import type { IPingRequest } from "../interfaces/mod.ts";
import { isSpecificRequest } from "./is-specific-request.validator.ts";

export function isPingRequest(value: unknown) {
  return isSpecificRequest<IPingRequest>(
    value,
    ProtocolMessage.PING,
  );
}
