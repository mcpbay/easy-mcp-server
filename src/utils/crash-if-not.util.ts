import { RequestException } from "../exceptions/mod.ts";
import type { IProtocolErrorResponse } from "../interfaces/mod.ts";

export interface ICrashIfNotOptions {
  reportToClient?: boolean;
}

export function crashIfNot(
  expr: unknown,
  args: IProtocolErrorResponse<any>["error"] & ICrashIfNotOptions,
): asserts expr {
  if (!expr) {
    if (args.reportToClient) {
      throw new RequestException(args.message, args.code, args.data);
    } else {
      throw new Error(args.message);
    }
  }
}
