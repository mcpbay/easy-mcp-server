import type { ICancelledNotification, IInitializedNotification } from "../interfaces/mod.ts";
import { ProtocolNotification } from "../enums/mod.ts";
import { isSpecificNotification } from "./is-specific-notification.validator.ts";

export function isCancelledNotification(value: unknown) {
  return isSpecificNotification<ICancelledNotification>(
    value,
    ProtocolNotification.CANCELLED,
  );
}
