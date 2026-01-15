import type { IInitializedNotification } from "../interfaces/mod.ts";
import { ProtocolNotification } from "../enums/mod.ts";
import { isSpecificNotification } from "./is-specific-notification.validator.ts";

export function isInitializedNotification(value: unknown) {
  return isSpecificNotification<IInitializedNotification>(
    value,
    ProtocolNotification.INITIALIZED,
  );
}
