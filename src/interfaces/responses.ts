import type { IGenericProtocolResponse } from "./common.ts";
import type { ICapabilities, IPrompt, IPromptMessage } from "./entities.ts";

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