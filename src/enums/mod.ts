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
}

export enum ProtocolNotification {
  INITIALIZED = "notifications/initialized",
  CANCELLED = "notifications/cancelled",
  PROMPTS_LIST_CHANGED = "notifications/prompts/list_changed",
  PROGRESS = "notifications/progress",
  TOOLS_LIST_CHANGED = "notifications/tools/list_changed"
}
