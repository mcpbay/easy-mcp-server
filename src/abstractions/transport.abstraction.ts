import type { MessageHandler } from "../types/mod.ts";

export abstract class Transport {
  /**
   * The initialization of the transport.
   * @param messagesHandler The messages handler, make sure to use the `MessageHandler` type.
   */
  public abstract onInitialize(messagesHandler: MessageHandler): Promise<void>;
  /**
   * Send a response to the client.
   * @param message The whole message to send to the client.
   */
  public abstract response(message: object): Promise<void>;
  /**
   * Send a notification to the client.
   * @param message The whole message to send to the client.
   */
  public abstract notify(message: object): Promise<void>;
  /**
   * Close the transport.
   */
  public abstract onClose(): Promise<void>;
}
