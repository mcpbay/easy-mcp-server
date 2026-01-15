import type { IGenericNotification } from "../interfaces/mod.ts";
import { isJSONRpc } from "./is-json-rpc.validator.ts";

export function isGenericNotification(
  value: unknown,
): value is IGenericNotification {
  return isJSONRpc(value) && "method" in value && !("id" in value);
}
