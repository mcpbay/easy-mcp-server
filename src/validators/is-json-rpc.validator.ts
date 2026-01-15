import { isPlainObject } from "@online/is";
import type { IClientMinimalRequestStructure } from "../interfaces/mod.ts";

export function isJSONRpc(
  value: unknown,
  version = "2.0",
): value is IClientMinimalRequestStructure {
  return isPlainObject(value) && "jsonrpc" in value &&
    value.jsonrpc === version;
}
