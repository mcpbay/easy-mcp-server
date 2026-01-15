import type { IGenericRequest } from "../interfaces/mod.ts";
import { isJSONRpc } from "./is-json-rpc.validator.ts";

export function isGenericRequest(value: unknown): value is IGenericRequest {
  return isJSONRpc(value) && "method" in value && "id" in value;
}
