import { LogLevel } from "../enums/mod.ts";
import type {
  IClientMinimalRequestStructure,
  IRequestParamsMetadata,
} from "./common.ts";
import { ICapabilities } from "./entities.ts";

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
  params?: { cursor: string } & IRequestParamsMetadata;
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
  params?: { cursor: string } & IRequestParamsMetadata;
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
  params?: { cursor: string } & IRequestParamsMetadata;
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
