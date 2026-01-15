import { ProtocolMessage, ProtocolNotification } from "../enums/mod.ts";
import { isGenericNotification } from "./is-generic-notification.validator.ts";

export function isSpecificNotification<T>(
  value: unknown,
  method: ProtocolNotification,
): value is T {
  return isGenericNotification(value) && value.method === method;
}
