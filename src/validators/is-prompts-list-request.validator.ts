import { ProtocolMessage } from "../enums/mod.ts";
import type { IPromptsListRequest } from "../interfaces/mod.ts";
import { isGenericRequest } from "./is-generic-request.validator.ts";

export function isPromptsListRequest(value: unknown): value is IPromptsListRequest {
  return isGenericRequest(value) && value.method === ProtocolMessage.PROMPTS_LIST;
}