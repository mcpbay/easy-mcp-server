/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptMessage {
  role: "user" | "assistant";
  content:
  | IPromptMessageTextContent
  | IPromptMessageImageContent
  | IPromptMessageResourceContent;
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptMessageTextContent {
  type: "text";
  text: string;
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptMessageImageContent {
  type: "image";
  data: string;
  mimeType: string;
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptMessageResourceContent {
  type: "resource";
  resource: Omit<IResource, "name">;
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

/**
 * https://modelcontextprotocol.io/specification/2024-11-05/server/resources#user-interaction-model
 */
export interface IResourceTextContent {
  uri: string;
  mimeType: "text/plain";
  text: string;
}

/**
 * https://modelcontextprotocol.io/specification/2024-11-05/server/resources#user-interaction-model
 */
export interface IResourceFileContent {
  uri: string;
  mimeType: string;
  /**
   * Base64
   */
  blob: string;
}

export type IResourceContent = IResourceTextContent | IResourceFileContent;

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/resources/
 */
export interface IResource {
  name: string;
  description: string;
  link: string;
  mimeType: string;
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPrompt {
  name: string;
  description: string;
  arguments?: IPromptArgument[];
}

export interface IInputSchemaProperty {
  type: "object";
  properties?: Record<string, object>;
  required?: string[];
}

export interface ITool {
  name: string;
  description: string;
  /**
   * https://json-schema.org/
   */
  inputSchema: IInputSchemaProperty;
}

export interface ICapabilities {
  tools: {
    listChanged: boolean;
  };
  prompts: {
    listChanged: boolean;
  };
  resources: Partial<{
    listChanged: boolean;
    subscribe: boolean;
  }>;
  completions: {
    listChanged: boolean;
  };
  sampling: {};
  roots: {
    listChanged: boolean;
  };
  logging: {};
}
