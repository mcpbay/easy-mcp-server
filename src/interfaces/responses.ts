import type { IGenericProtocolResponse } from "./common.ts";
import type { ICapabilities, IPrompt, IPromptMessage, IResource, IResourceContent, ITool } from "./entities.ts";

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/utilities/completion/
 */
export interface ICompletionCompleteResponse extends
  IGenericProtocolResponse<{
    completion: {
      /**
       * 100 items max each time.
       */
      values: string[];
      hasMore: boolean;
      total?: number;
    };
  }> { }

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptsListResponse extends
  IGenericProtocolResponse<{
    prompts: IPrompt[];
    nextCursor?: string;
  }> { }

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptsGetResponse extends
  IGenericProtocolResponse<{
    description: string;
    messages: IPromptMessage[];
  }> { }

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/basic/lifecycle/#initialization
 */
export interface IInitializeResponse extends
  IGenericProtocolResponse<{
    protocolVersion: string;
    capabilities: ICapabilities;
    serverInfo: {
      name: string;
      version: string;
    };
  }> { }

/**
 * https://modelcontextprotocol.io/specification/2024-11-05/basic/utilities/ping
 */
export interface IPingResponse extends IGenericProtocolResponse<{}> { }

/**
 * https://modelcontextprotocol.io/specification/2024-11-05/server/tools
 */
export interface IToolsListResponse extends IGenericProtocolResponse<{ tools: ITool[]; nextCursor?: string; }> { }

/**
 * https://modelcontextprotocol.io/specification/2024-11-05/server/tools
 */
export interface IToolsCallResponse extends IGenericProtocolResponse<{ content: IPromptMessage[]; isError: boolean; }> { }

/**
 * https://modelcontextprotocol.io/specification/2024-11-05/server/resources#user-interaction-model
 */
export interface IResourcesListResponse extends IGenericProtocolResponse<{ resources: IResource[]; nextCursor?: string; }> { }

/**
 * https://modelcontextprotocol.io/specification/2024-11-05/server/resources#user-interaction-model
 */
export interface IResourcesReadResponse extends IGenericProtocolResponse<{ contents: IResourceContent[]; }> { }


export interface ILoggingSetLevelResponse extends IGenericProtocolResponse<{}> { }

export interface IResourcesSubscribeResponse extends IGenericProtocolResponse<{}> { }