export type MessageHandler = (message: object) => Promise<void>;

export interface IMessageHandlerClass {
  messageHandler: MessageHandler;
}

export type RequestId = string | number;

export type Role = "assistant" | "user";
