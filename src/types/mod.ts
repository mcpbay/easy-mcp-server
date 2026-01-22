export type MessageHandler = (message: object) => Promise<void>;

export interface IMessageHandlerClass {
  messageHandler: MessageHandler;
}

export type RequestId = string | number;

export type ProtocolVersion =
  | "2024-11-05"
  | "2025-03-26"
  | "2025-06-18"
  | "2025-11-25";