import { ProtocolMessage } from "../enums/mod.ts";
import type { IPromptsGetRequest } from "../interfaces/mod.ts";
import { isSpecificRequest } from "./is-specific-request.validator.ts";

export function isPromptsGetRequest(value: unknown) {
  return isSpecificRequest<IPromptsGetRequest>(
    value,
    ProtocolMessage.PROMPTS_GET,
  );
}
