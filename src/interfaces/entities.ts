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
  description?: string;
  required?: boolean;
}

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
  description?: string;
  arguments?: IPromptArgument[];
}

export interface ITool {
  name: string;
  description: string;
  link: string;
}

export interface ICapabilities {
  tools: {
    listChanged: boolean;
  };
  prompts: {
    listChanged: boolean;
  };
  resources: {
    listChanged: boolean;
  };
  completions: {
    listChanged: boolean;
  };
}
