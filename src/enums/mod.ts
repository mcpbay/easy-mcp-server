export enum ProtocolMessage {
  /**
   * https://modelcontextprotocol.info/specification/2024-11-05/basic/lifecycle/#initialization
   */
  INITIALIZE = "initialize",
  /**
   * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
   */
  PROMPTS_LIST = "prompts/list",
  /**
   * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
   */
  PROMPTS_GET = "prompts/get",
  /**
   * https://modelcontextprotocol.io/specification/2024-11-05/server/tools
   */
  TOOLS_LIST = "tools/list",
  /**
   * https://modelcontextprotocol.io/specification/2024-11-05/server/tools
   */
  TOOLS_CALL = "tools/call",
  /**
   * https://modelcontextprotocol.info/specification/2024-11-05/server/utilities/completion/
   */
  COMPLETION_COMPLETE = "completion/complete",
  /**
   * https://modelcontextprotocol.io/specification/2024-11-05/basic/utilities/ping
   */
  PING = "ping",
  /**
   * https://modelcontextprotocol.io/specification/2024-11-05/server/resources#user-interaction-model
   */
  RESOURCES_LIST = "resources/list",
  /**
   * https://modelcontextprotocol.io/specification/2024-11-05/server/resources#user-interaction-model
   */
  RESOURCES_READ = "resources/read",
  /**
   * https://modelcontextprotocol.io/specification/2024-11-05/server/utilities/logging
   */
  LOGGING_SET_LEVEL = "logging/setLevel",
  /**
   * https://modelcontextprotocol.io/specification/2025-11-25/server/resources#subscriptions
   */
  RESOURCES_SUBSCRIBE = "resources/subscribe",
  /**
   * https://modelcontextprotocol.io/specification/2024-11-05/client/sampling
   */
  SAMPLING_CREATE_MESSAGE = "sampling/createMessage",
  /**
   * https://modelcontextprotocol.io/specification/2024-11-05/client/roots#user-interaction-model
   */
  ROOTS_LIST = "roots/list",
  /**
   * https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation
   */
  ELICITATION_CREATE = "elicitation/create",

  TASKS_LIST = "tasks/list",
  TASKS_GET = "tasks/get",
  TASKS_CANCEL = "tasks/cancel",
  TASKS_RESULT = "tasks/result",
}

export enum ProtocolNotification {
  INITIALIZED = "notifications/initialized",
  CANCELLED = "notifications/cancelled",
  PROMPTS_LIST_CHANGED = "notifications/prompts/list_changed",
  PROGRESS = "notifications/progress",
  TOOLS_LIST_CHANGED = "notifications/tools/list_changed",
  /**
   * https://modelcontextprotocol.io/specification/2024-11-05/server/utilities/logging#log-message-notifications
   */
  MESSAGE = "notifications/message",
  RESOURCES_LIST_CHANGED = "notifications/resources/list_changed",
  RESOURCES_UPDATED = "notifications/resources/updated",
  ROOTS_CHANGED = "notifications/roots/list_changed",
  ELICITATION_COMPLETE = "notifications/elicitation/complete",
  TASKS_STATUS = "notifications/tasks/status",
}

/**
 * https://modelcontextprotocol.io/specification/2024-11-05/server/utilities/logging#log-levels
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  NOTICE = "notice",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
  ALERT = "alert",
  EMERGENCY = "emergency",
}

export enum ContextModelEntityType {
  PROMPT = "prompt",
  TOOL = "tool",
  RESOURCE = "resource",
}

export enum TaskStatus {
  WORKING = "working",
  INPUT_REQUIRED = "input_required",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum Role {
  ASSISTANT = "assistant",
  USER = "user",
}
