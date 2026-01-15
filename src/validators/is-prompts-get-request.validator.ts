import { ProtocolMessage } from "../enums/mod.ts";
import type { IPromptsGetRequest } from "../interfaces/mod.ts";
import { isGenericRequest } from "./is-generic-request.validator.ts";

export function isPromptsGetRequest(value: unknown): value is IPromptsGetRequest {
  return isGenericRequest(value) && value.method === ProtocolMessage.PROMPTS_GET;
}