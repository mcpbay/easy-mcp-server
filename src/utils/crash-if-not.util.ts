import { RequestException } from "../exceptions/mod.ts";
import type { IProtocolErrorResponse } from "../interfaces/mod.ts";

export type CrashIfNotArguments =
  & IProtocolErrorResponse<any>["error"]
  & ICrashIfNotOptions;

export interface ICrashIfNotOptions {
  doNotReportToClient?: boolean;
  catch?(args: CrashIfNotArguments): void;
}

export function crashIfNot(
  expr: unknown,
  args: CrashIfNotArguments,
): asserts expr {
  if (!expr) {
    args.catch?.(args);
    if (args.doNotReportToClient) {
      throw new Error(args.message);
    } else {
      throw new RequestException(args.message, args.code, args.data);
    }
  }
}
