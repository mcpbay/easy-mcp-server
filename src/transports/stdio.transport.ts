import process from "node:process";
import { Transport } from "../abstractions/mod.ts";
import type { IMessageHandlerClass } from "../types/mod.ts";

export class StdioTransport extends Transport {
  async onInitialize(messageHandlerClass: IMessageHandlerClass): Promise<void> {
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
            } catch {
              console.error("Invalid JSON:", message);
              return {};
            }
          })();

          messageHandlerClass.messageHandler(parsedMessage);
        }
      }
    });

    process.stdin.on("end", () => void this.onClose());
  }

  async send(message: object): Promise<void> {
    // Send response JSON followed by a newline character to stdout
    process.stdout.write(JSON.stringify(message) + "\n");
  }

  async notify(message: object): Promise<void> {
    // Send notification JSON followed by a newline character to stdout
    process.stdout.write(JSON.stringify(message) + "\n");
  }

  public async onClose(): Promise<void> {
    // Log transport stop to stderr/console.error, not stdout
    console.error("Stdio transport stopping...");
  }
}
