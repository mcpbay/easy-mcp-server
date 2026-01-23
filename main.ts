import { EasyMCPServer, writeLog } from "@mcpbay/mcpserver";
import { StdioTransport } from "@mcpbay/mcpserver/transports";
import { IContextModel, IContextModelOptions, IPrompt, IPromptsGetResponse, IServerClientInformation, ICompletionCompleteRequest, ICompletionCompleteResponse, IResource, IResourceContent, IResourcesListResponse } from "@mcpbay/mcpserver/types";
import { Role, ContextModelEntityType } from "@mcpbay/mcpserver/enums";

class ContextModel implements IContextModel {

  async onClientListInformation(options: IContextModelOptions): Promise<IServerClientInformation> {
    return {
      name: "Example Server",
      version: "1.0.0",
      description: "This is a simple example server",
    };
  }

  async onClientListPrompts(options: IContextModelOptions): Promise<IPrompt[]> {
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
              text: `send me the "`+ args['example-argument'] as string + `" message.`
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

  async onClientListResources(options: IContextModelOptions): Promise<IResourcesListResponse["result"]["resources"]> {
    const resource: IResource = {
      name: "README.md",
      description: "Archivo de documentación principal",
      link: "mcp://easymcp/readme",
      mimeType: "text/markdown",
    };

    return [resource];
  }

  async onClientReadResource(resourceUri: string, options: IContextModelOptions): Promise<IResourceContent[]> {
    const RESOURCE_URI = "mcp://easymcp/readme";

    if (resourceUri === RESOURCE_URI) {
      return [
        {
          uri: RESOURCE_URI,
          mimeType: "text/markdown",
          text: "# Ejemplo de README",
        },
        {
          uri: RESOURCE_URI,
          mimeType: "text/markdown",
          text: "Este es el contenido de un recurso exportado por el MCP para demostrar mejores prácticas en TypeScript.",
        }
      ];
    }

    return [];
  }

  async onClientRequestsCompletion?(entityType: ContextModelEntityType, args: ICompletionCompleteRequest["params"]["argument"], options: IContextModelOptions): Promise<ICompletionCompleteResponse["result"]["completion"]> {
    writeLog(`onClientRequestsCompletion: entityType: ${entityType}, args: ${JSON.stringify(args)}`);
    if (entityType === ContextModelEntityType.PROMPT && args.name === 'example-argument') {
      return {
        values: ['example-argument'],
        hasMore: false,
        total: 1
      };
    }

    return {
      values: [],
      hasMore: false,
      total: 0
    };
  }

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
