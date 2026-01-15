import process from "node:process";
import { Transport } from "../abstractions/mod.ts";
import { MessageHandler } from "../types/mod.ts";

export class StdioTransport extends Transport {
  async onInitialize(messagesHandler: MessageHandler): Promise<void> {
    console.log("Stdio transport starting...");

    process.stdin.setEncoding("utf-8");
    let buffer = "";

    process.stdin.on("data", (chunk: string) => {
      buffer += chunk;
      const messages = buffer.split("\n");
      buffer = messages.pop() || "";

      for (const message of messages) {
        if (message.trim()) {
          const parsedMessage = (() => {
            try {
              const json = JSON.parse(message);
              return json;
            } catch (e) {
              console.error("Invalid JSON:", message);
              return {};
            }
          })();

          messagesHandler(parsedMessage);
        }
      }
    });

    process.stdin.on("end", () => void this.onClose());
    console.log("Stdio transport started!");
  }

  async response(message: object): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async notify(message: object): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async onClose(): Promise<void> {
    console.error("Stdio transport stopping...");
  }
}
