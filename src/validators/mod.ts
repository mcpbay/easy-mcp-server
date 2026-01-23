import { isPlainObject } from "@online/is";
import { ProtocolMessage, ProtocolNotification } from "../enums/mod.ts";
import type {
  ICancelledNotification,
  IClientMinimalRequestStructure,
  ICompletionCompleteRequest,
  IGenericNotification,
  IGenericProtocolResponse,
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
  IRootsListChangedNotification,
  ITasksCancelRequest,
  ITasksGetRequest,
  ITasksListRequest,
  ITasksResultRequest,
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

export function isInitializedNotification(
  value: unknown,
): value is IInitializedNotification {
  return isSpecificNotification<IInitializedNotification>(
    value,
    ProtocolNotification.INITIALIZED,
  );
}

export function isInitializeRequest(
  value: unknown,
): value is IInitializeRequest {
  return isSpecificRequest<IInitializeRequest>(
    value,
    ProtocolMessage.INITIALIZE,
  );
}

export function isPromptsListRequest(
  value: unknown,
): value is IPromptsListRequest {
  return isSpecificRequest<IPromptsListRequest>(
    value,
    ProtocolMessage.PROMPTS_LIST,
  );
}

export function isPromptsGetRequest(
  value: unknown,
): value is IPromptsGetRequest {
  return isSpecificRequest<IPromptsGetRequest>(
    value,
    ProtocolMessage.PROMPTS_GET,
  );
}

export function isPingRequest(value: unknown): value is IPingRequest {
  return isSpecificRequest<IPingRequest>(
    value,
    ProtocolMessage.PING,
  );
}

export function isToolsListRequest(value: unknown): value is IToolsListRequest {
  return isSpecificRequest<IToolsListRequest>(
    value,
    ProtocolMessage.TOOLS_LIST,
  );
}

export function isToolsCallRequest(value: unknown): value is IToolsCallRequest {
  return isSpecificRequest<IToolsCallRequest>(
    value,
    ProtocolMessage.TOOLS_CALL,
  );
}

export function isCancelledNotification(
  value: unknown,
): value is ICancelledNotification {
  return isSpecificNotification<ICancelledNotification>(
    value,
    ProtocolNotification.CANCELLED,
  );
}

export function isProgressNotification(
  value: unknown,
): value is IProgressNotification {
  return isSpecificNotification<IProgressNotification>(
    value,
    ProtocolNotification.PROGRESS,
  );
}

export function isRootsListChangedNotification(
  value: unknown,
): value is IRootsListChangedNotification {
  return isSpecificNotification<IRootsListChangedNotification>(
    value,
    ProtocolNotification.ROOTS_CHANGED,
  );
}

export function isCompletionCompleteRequest(
  value: unknown,
): value is ICompletionCompleteRequest {
  return isSpecificRequest<ICompletionCompleteRequest>(
    value,
    ProtocolMessage.COMPLETION_COMPLETE,
  );
}

export function isResourcesListRequest(
  value: unknown,
): value is IResourcesListRequest {
  return isSpecificRequest<IResourcesListRequest>(
    value,
    ProtocolMessage.RESOURCES_LIST,
  );
}

export function isResourcesReadRequest(
  value: unknown,
): value is IResourcesReadRequest {
  return isSpecificRequest<IResourcesReadRequest>(
    value,
    ProtocolMessage.RESOURCES_READ,
  );
}

export function isLoggingSetLevelRequest(
  value: unknown,
): value is ILoggingSetLevelRequest {
  return isSpecificRequest<ILoggingSetLevelRequest>(
    value,
    ProtocolMessage.LOGGING_SET_LEVEL,
  );
}

export function isResourcesSubscribeRequest(
  value: unknown,
): value is IResourcesSubscribeRequest {
  return isSpecificRequest<IResourcesSubscribeRequest>(
    value,
    ProtocolMessage.RESOURCES_SUBSCRIBE,
  );
}

export function isGenericResultResponse(
  value: unknown,
): value is IGenericProtocolResponse<unknown> {
  return isJSONRpc(value) && !("method" in value) && "id" in value &&
    "result" in value;
}

export function isTasksListRequest(value: unknown): value is ITasksListRequest {
  return isSpecificRequest<ITasksListRequest>(
    value,
    ProtocolMessage.TASKS_LIST,
  );
}

export function isTasksGetRequest(value: unknown): value is ITasksGetRequest {
  return isSpecificRequest<ITasksGetRequest>(
    value,
    ProtocolMessage.TASKS_GET,
  );
}

export function isTasksCancelRequest(
  value: unknown,
): value is ITasksCancelRequest {
  return isSpecificRequest<ITasksCancelRequest>(
    value,
    ProtocolMessage.TASKS_CANCEL,
  );
}

export function isTasksResultRequest(
  value: unknown,
): value is ITasksResultRequest {
  return isSpecificRequest<ITasksResultRequest>(
    value,
    ProtocolMessage.TASKS_RESULT,
  );
}
