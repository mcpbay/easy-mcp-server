import { Role, TaskStatus } from "../enums/mod.ts";

export interface ITitleable {
  /**
   * Since https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle
   */
  title?: string;
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptMessage {
  role: Role;
  content:
    | IPromptMessageTextContent
    | IPromptMessageImageContent
    | IPromptMessageResourceContent
    | IPromptMessageAudioContent;
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
  /**
   * Base64
   */
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
 * https://modelcontextprotocol.io/specification/2025-03-26/server/tools#audio-content
 * Version: 2025-03-26+
 */
export interface IPromptMessageAudioContent {
  type: "audio";
  data: string;
  mimeType: string;
}

export interface IToolResultResourceLinkContent {
  type: "resource_link";
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  annotations?: Partial<{
    audience: Role[];
    /**
     * 0 to 1.
     */
    priority: number;
    /**
     * ISO 8601.
     */
    lastModified: string;
  }>;
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
export interface IResource extends ITitleable {
  name: string;
  description: string;
  link: string;
  mimeType: string;
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPrompt extends ITitleable {
  name: string;
  description: string;
  arguments?: IPromptArgument[];
}

export interface IInputOutputSchemaProperty {
  type: "object";
  properties?: Record<string, object>;
  required?: string[];
}

export interface ITool extends ITitleable {
  name: string;
  description: string;
  /**
   * https://json-schema.org/
   */
  inputSchema: IInputOutputSchemaProperty;
  /**
   * https://modelcontextprotocol.io/specification/2025-06-18/server/tools#output-schema
   */
  outputSchema?: IInputOutputSchemaProperty;
  /**
   * https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks#tool-level-negotiation
   */
  execution?: { taskSupport: "required" | "optional" | "forbidden" };
  /**
   * https://modelcontextprotocol.io/specification/2025-03-26/changelog
   */
  annotations?: Partial<{
    /**
     * A human-readable title for the tool.
     */
    title: string;
    /**
     * If true, the tool does not modify its environment.
     *
     * Default: false
     */
    readOnlyHint: boolean;
    /**
     * If true, the tool may perform destructive updates to its environment.
     * If false, the tool performs only additive updates.
     *
     * (This property is meaningful only when `readOnlyHint == false`)
     *
     * Default: true
     */
    destructiveHint: boolean;
    /**
     * If true, calling the tool repeatedly with the same arguments
     * will have no additional effect on the its environment.
     *
     * (This property is meaningful only when `readOnlyHint == false`)
     *
     * Default: false
     */
    idempotentHint: boolean;
    /**
     * If true, this tool may interact with an "open world" of external
     * entities. If false, the tool's domain of interaction is closed.
     * For example, the world of a web search tool is open, whereas that
     * of a memory tool is not.
     *
     * Default: true
     */
    openWorldHint: boolean;
  }>;
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
  roots: {
    listChanged: boolean;
  };
  completions?: {};
  sampling?: {};
  logging?: {};
  tasks?: Partial<{
    lists: {};
    cancel: {};
    requests: {
      tools: { call: {} };
    };
  }>;
  elicitation?: Partial<{
    forms: {};
    urls: {};
  }>;
}

export interface IRoot {
  uri: string;
  name: string;
}

export interface IIcon {
  src: string;
  mimeType: string;
  /**
   * `any` for svg.
   */
  sizes: string[];
  theme?: "light" | "dark";
}

export interface IServerClientInformation extends ITitleable {
  name: string;
  version: string;
  /**
   * Since https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
   */
  description?: string;
  /**
   * Since https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
   */
  icons?: IIcon[];
  /**
   * Since https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
   */
  websiteUrl?: string;
  /**
   * Since https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
   */
  instructions?: string;
}

export interface ITaskState {
  taskId: string;
  status: TaskStatus;
  statusMessage: string;
  /**
   * `null` for infinite.
   */
  ttl: number | null;
  createdAt: string;
  lastUpdatedAt: string;
  pollInterval?: number;
}
