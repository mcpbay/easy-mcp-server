import { LogLevel } from "../enums/mod.ts";
import type {
  IClientMinimalRequestStructure,
  IRequestParamsMetadata,
} from "./common.ts";
import { ICapabilities, IPromptMessageImageContent, IPromptMessageTextContent } from "./entities.ts";

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/utilities/completion/
 */
export interface ICompletionCompleteRequest
  extends IClientMinimalRequestStructure {
  method: "completion/complete";
  params: {
    ref: {
      type: "ref/prompt";
      name: string;
    } | {
      type: "ref/resource";
      uri: string;
    };
    argument: {
      name: string;
      value: string;
    };
  } & IRequestParamsMetadata;
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptsListRequest extends IClientMinimalRequestStructure {
  method: "prompts/list";
  params?: { cursor: string; } & IRequestParamsMetadata;
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptsGetRequest extends IClientMinimalRequestStructure {
  method: "prompts/get";
  params: {
    name: string;
    arguments: Record<string, unknown>;
  } & IRequestParamsMetadata;
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/basic/lifecycle/#initialization
 */
export interface IInitializeRequest extends IClientMinimalRequestStructure {
  method: "initialize";
  params: {
    protocolVersion: string;
    capabilities: ICapabilities;
    clientInfo: {
      name: string;
      version: string;
    };
  } & IRequestParamsMetadata;
}

/**
 * https://modelcontextprotocol.io/specification/2024-11-05/basic/utilities/ping
 */
export interface IPingRequest extends IClientMinimalRequestStructure {
  method: "ping";
}

export interface IToolsListRequest extends IClientMinimalRequestStructure {
  method: "tools/list";
  params?: { cursor: string; } & IRequestParamsMetadata;
}

export interface IToolsCallRequest extends IClientMinimalRequestStructure {
  method: "tools/call";
  params: {
    name: string;
    arguments: Record<string, unknown>;
  } & IRequestParamsMetadata;
}

export interface IResourcesListRequest extends IClientMinimalRequestStructure {
  method: "resources/list";
  params?: { cursor: string; } & IRequestParamsMetadata;
}

export interface IResourcesReadRequest extends IClientMinimalRequestStructure {
  method: "resources/read";
  params: {
    uri: string;
  } & IRequestParamsMetadata;
}

export interface ILoggingSetLevelRequest
  extends IClientMinimalRequestStructure {
  method: "logging/setLevel";
  params: {
    level: LogLevel;
  } & IRequestParamsMetadata;
}

export interface IResourcesSubscribeRequest
  extends IClientMinimalRequestStructure {
  method: "resources/subscribe";
  params: {
    uri: string;
  } & IRequestParamsMetadata;
}

export interface ISamplingMessageContent {
  role: "user" | "assistant";
  content: IPromptMessageTextContent | IPromptMessageImageContent;
}

export interface IModelHint {
  /**
   * A hint for a model name.
   *
   * The client SHOULD treat this as a substring of a model name; for example:
   *  - `claude-3-5-sonnet` should match `claude-3-5-sonnet-20241022`
   *  - `sonnet` should match `claude-3-5-sonnet-20241022`, `claude-3-sonnet-20240229`, etc.
   *  - `claude` should match any Claude model
   *
   * The client MAY also map the string to a different provider's model name or a different model family, as long as it fills a similar niche; for example:
   *  - `gemini-1.5-flash` could match `claude-3-haiku-20240307`
   */
  name: string;
}

export interface IModelPreferences {
  /**
   * Optional hints to use for model selection.
   *
   * If multiple hints are specified, the client MUST evaluate them in order
   * (such that the first match is taken).
   *
   * The client SHOULD prioritize these hints over the numeric priorities, but
   * MAY still use the priorities to select from ambiguous matches.
   */
  hints: IModelHint[];

  /**
   * How much to prioritize cost when selecting a model. A value of 0 means cost
   * is not important, while a value of 1 means cost is the most important
   * factor.
   *
   * @TJS-type number
   * @minimum 0
   * @maximum 1
   */
  costPriority: number;

  /**
   * How much to prioritize sampling speed (latency) when selecting a model. A
   * value of 0 means speed is not important, while a value of 1 means speed is
   * the most important factor.
   *
   * @TJS-type number
   * @minimum 0
   * @maximum 1
   */
  speedPriority: number;

  /**
   * How much to prioritize intelligence and capabilities when selecting a
   * model. A value of 0 means intelligence is not important, while a value of 1
   * means intelligence is the most important factor.
   *
   * @TJS-type number
   * @minimum 0
   * @maximum 1
   */
  intelligencePriority: number;
}

/**
 * https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2024-11-05/schema.ts#L764
 */
export interface ISamplingCreateMessageRequest
  extends IClientMinimalRequestStructure {
  method: "sampling/createMessage";
  params: {
    messages: ISamplingMessageContent[];
    /**
     * The server's preferences for which model to select. The client MAY ignore these preferences.
     */
    modelPreferences?: Partial<IModelPreferences>;
    /**
     * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
     */
    systemPrompt?: string;
    /**
     * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt. The client MAY ignore this request.
     */
    includeContext?: "none" | "thisServer" | "allServers";
    /**
     * @TJS-type number
     */
    temperature?: number;
    /**
     * The maximum number of tokens to sample, as requested by the server. The client MAY choose to sample fewer tokens than requested.
     */
    maxTokens: number;
    stopSequences?: string[];
    /**
     * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
     */
    metadata?: object;
  } & IRequestParamsMetadata;
}