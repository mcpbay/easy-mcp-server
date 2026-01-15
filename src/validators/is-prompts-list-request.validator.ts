import { ProtocolMessage } from "../enums/mod.ts";
import type { IPromptsListRequest } from "../interfaces/mod.ts";
import { isSpecificRequest } from "./is-specific-request.validator.ts";

export function isPromptsListRequest(value: unknown) {
  return isSpecificRequest<IPromptsListRequest>(
    value,
    ProtocolMessage.PROMPTS_LIST,
  );
}
