import { RequestException } from "../exceptions/mod.ts";
import { IProtocolErrorResponse } from "../interfaces/mod.ts";

export function crashIfNot(
  expr: unknown,
  args: IProtocolErrorResponse<any>["error"],
): asserts expr {
  if (!expr) {
    throw new RequestException(args.message, args.code, args.data);
  }
}
