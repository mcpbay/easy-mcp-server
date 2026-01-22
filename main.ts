import { EasyMCPServer } from "@mcpbay/mcpserver";
import { StdioTransport } from "@mcpbay/mcpserver/transports";
import { IContextModel, IContextModelOptions, IPrompt, IPromptsGetResponse, IServerClientInformation } from "@mcpbay/mcpserver/types";
import { Role } from "@mcpbay/mcpserver/enums";

class ContextModel implements IContextModel {

  async onClientListInformation(options: IContextModelOptions): Promise<IServerClientInformation> {
    return {
      name: "Example Server",
      version: "1.0.0",
      description: "This is a simple example server",
    };
  }

  async onClientListPrompts?(options: IContextModelOptions): Promise<IPrompt[]> {
    return [
      {
        name: "echo-prompt",
        description: "Prompt to test, it will return the argument",
        arguments: [
          {
            name: "example-argument",
            description: "This is an example argument",
          }
        ]
      }
    ];
  }

  async onClientGetPrompt(prompt: IPrompt, args: Record<string, unknown>, options: IContextModelOptions): Promise<IPromptsGetResponse["result"]> {
    if (prompt.name === 'echo-prompt') {
      return {
        description: '',
        messages: [
          {
            role: Role.USER,
            content: {
              type: 'text',
              text: args['example-argument'] as string
            }
          }
        ]
      };
    }

    return {
      description: '',
      messages: []
    };
  }

  // onClientListTools?(options: IContextModelOptions): Promise<ITool[]> {
  //   throw new Error("Method not implemented.");
  // }

  // onClientCallTool?(tool: ITool, args: Record<string, unknown>, options: IToolContextModelOptions): Promise<IToolsCallResponse["result"]["content"]> {
  //   throw new Error("Method not implemented.");
  // }

  // onClientListResources?(options: IContextModelOptions): Promise<IResourcesListResponse["result"]["resources"]> {
  //   throw new Error("Method not implemented.");
  // }

  // onClientReadResource?(resourceUri: string, options: IContextModelOptions): Promise<IResourceContent[]> {
  //   throw new Error("Method not implemented.");
  // }

  // onClientRequestsCompletion?(entityType: ContextModelEntityType, args: ICompletionCompleteRequest["params"]["argument"], options: IContextModelOptions): Promise<ICompletionCompleteResponse["result"]["completion"]> {
  //   throw new Error("Method not implemented.");
  // }

  // onClientConnect?(options: IContextModelOptions): Promise<void> {
  //   throw new Error("Method not implemented.");
  // }

  // onClientRootsChanged?(options: IContextModelOptions): Promise<void> {
  //   throw new Error("Method not implemented.");
  // }
}

const context = new ContextModel();
const server = new EasyMCPServer(new StdioTransport(), context, {
  timeout: 10000,
});

server.start();