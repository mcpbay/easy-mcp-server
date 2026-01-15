export interface IClientMinimalRequestStructure {
  jsonrpc: "2.0";
  id: number;
}

export interface IGenericProtocolResponse<T> extends IClientMinimalRequestStructure {
  result: T;
}

export interface IProtocolErrorResponse<T> extends IClientMinimalRequestStructure {
  error: {
    code: number;
    message: string;
    data?: T;
  };
}

export interface IGenericRequest extends IClientMinimalRequestStructure {
  method: string;
}