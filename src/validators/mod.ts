import { isPlainObject } from "@online/is";
import { ProtocolMessage, ProtocolNotification } from "../enums/mod.ts";
import type {
  ICancelledNotification,
  IClientMinimalRequestStructure,
  ICompletionCompleteRequest,
  IGenericNotification,
  IGenericRequest,
  IInitializedNotification,
  IInitializeRequest,
  ILoggingSetLevelRequest,
  IPingRequest,
  IProgressNotification,
  IPromptsGetRequest,
  IPromptsListRequest,
  IResourcesListRequest,
  IResourcesReadRequest,
  IResourcesSubscribeRequest,
  IToolsCallRequest,
  IToolsListRequest,
} from "../interfaces/mod.ts";

export function isJSONRpc(
  value: unknown,
  version = "2.0",
): value is IClientMinimalRequestStructure {
  return isPlainObject(value) && "jsonrpc" in value &&
    value.jsonrpc === version;
}

export function isSpecificRequest<T>(
  value: unknown,
  method: ProtocolMessage,
): value is T {
  return isGenericRequest(value) && value.method === method;
}

export function isSpecificNotification<T>(
  value: unknown,
  method: ProtocolNotification,
): value is T {
  return isGenericNotification(value) && value.method === method;
}

export function isGenericRequest(value: unknown): value is IGenericRequest {
  return isJSONRpc(value) && "method" in value && "id" in value;
}

export function isGenericNotification(
  value: unknown,
): value is IGenericNotification {
  return isJSONRpc(value) && "method" in value && !("id" in value);
}

export function isInitializedNotification(value: unknown) {
  return isSpecificNotification<IInitializedNotification>(
    value,
    ProtocolNotification.INITIALIZED,
  );
}

export function isInitializeRequest(value: unknown) {
  return isSpecificRequest<IInitializeRequest>(
    value,
    ProtocolMessage.INITIALIZE,
  );
}

export function isPromptsListRequest(value: unknown) {
  return isSpecificRequest<IPromptsListRequest>(
    value,
    ProtocolMessage.PROMPTS_LIST,
  );
}

export function isPromptsGetRequest(value: unknown) {
  return isSpecificRequest<IPromptsGetRequest>(
    value,
    ProtocolMessage.PROMPTS_GET,
  );
}

export function isPingRequest(value: unknown) {
  return isSpecificRequest<IPingRequest>(
    value,
    ProtocolMessage.PING,
  );
}

export function isToolsListRequest(value: unknown) {
  return isSpecificRequest<IToolsListRequest>(
    value,
    ProtocolMessage.TOOLS_LIST,
  );
}

export function isToolsCallRequest(value: unknown) {
  return isSpecificRequest<IToolsCallRequest>(
    value,
    ProtocolMessage.TOOLS_CALL,
  );
}

export function isCancelledNotification(value: unknown) {
  return isSpecificNotification<ICancelledNotification>(
    value,
    ProtocolNotification.CANCELLED,
  );
}

export function isProgressNotification(value: unknown) {
  return isSpecificNotification<IProgressNotification>(
    value,
    ProtocolNotification.PROGRESS,
  );
}

export function isCompletionCompleteRequest(value: unknown) {
  return isSpecificRequest<ICompletionCompleteRequest>(
    value,
    ProtocolMessage.COMPLETION_COMPLETE,
  );
}

export function isResourcesListRequest(value: unknown) {
  return isSpecificRequest<IResourcesListRequest>(
    value,
    ProtocolMessage.RESOURCES_LIST,
  );
}

export function isResourcesReadRequest(value: unknown) {
  return isSpecificRequest<IResourcesReadRequest>(
    value,
    ProtocolMessage.RESOURCES_READ,
  );
}

export function isLoggingSetLevelRequest(value: unknown) {
  return isSpecificRequest<ILoggingSetLevelRequest>(
    value,
    ProtocolMessage.LOGGING_SET_LEVEL,
  );
}

export function isResourcesSubscribeRequest(value: unknown) {
  return isSpecificRequest<IResourcesSubscribeRequest>(
    value,
    ProtocolMessage.RESOURCES_SUBSCRIBE,
  );
}
