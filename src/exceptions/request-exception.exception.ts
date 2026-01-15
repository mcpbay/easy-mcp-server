export class RequestException extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: object,
  ) {
    super(message);
  }
}
