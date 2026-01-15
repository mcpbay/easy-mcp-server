export enum ProtocolMessage {
  /**
   * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
   */
  PROMPTS_LIST = "prompts/list",
  /**
   * https://modelcontextprotocol.info/specification/2024-11-05/server/prompts/
   */
  PROMPTS_GET = "prompts/get",
  /**
   * https://modelcontextprotocol.info/specification/2024-11-05/server/utilities/completion/
   */
  COMPLETION_COMPLETE = "completion/complete",
}

export enum ProtocolNotification {
  PROMPTS_LIST_CHANGED = "notifications/prompts/list_changed"
}