export function crashIfNot(expr: unknown, message: string): asserts expr {
  if (!expr) {
    throw new Error(message);
  }
}