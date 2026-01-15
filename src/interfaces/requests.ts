import type { IClientMinimalRequestStructure } from "./common.ts";

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/utilities/completion/
 */
export interface ICompletionCompleteMessage extends IClientMinimalRequestStructure {
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
  };
}


/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptsListRequest extends IClientMinimalRequestStructure {
  method: "prompts/list";
  params?: { cursor: string; };
}

/**
 * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
 */
export interface IPromptsGetRequest extends IClientMinimalRequestStructure {
  method: "prompts/get";
  params: {
    name: string;
    arguments: Record<string, unknown>;
  };
}
