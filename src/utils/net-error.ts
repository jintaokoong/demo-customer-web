export class NetError extends Error {
  constructor(
    readonly type:
      | "server-error"
      | "network-error"
      | "unknown-error"
      | "validation-error",
    readonly message: string,
    readonly inner?: Error,
  ) {
    super(message);
  }
}
