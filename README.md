# @mcpbay/easy-mcp-server

> README.md written by artificial intelligence, reviewed by a human.

> This library is experimental! Do not use it in production yet!

A TypeScript/Deno implementation of the Model Context Protocol (MCP) server specification. This library provides a framework for building MCP servers that enable seamless communication between AI applications and various data sources, tools, and services.

## What is Model Context Protocol?

[The Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro) (MCP) is a standardized protocol that allows AI applications to interact with external tools, resources, and services in a structured way. It defines how clients and servers communicate to expose capabilities like tool execution, resource access, prompt management, and sampling operations.

## What does this library do?

This library provides a complete MCP server implementation that handles:

- **Protocol negotiation**: Supports MCP protocol versions `2024-11-05`, `2025-03-26`, `2025-06-18`, and `2025-11-25`
- **Request/response lifecycle**: Manages the complete message handling pipeline including validation, execution, and error handling
- **Transport layer**: Currently supports stdio transport for process-based communication
- **Timeout management**: Configurable timeouts for different operation types
- **Abort control**: Built-in request cancellation support

## Core Features

### Tools
Expose executable functions that clients can call. Tools can be synchronous or asynchronous and support optional task-based execution for long-running operations.

### Resources
Provide access to data sources (files, API responses, database queries, etc.). Resources can be listed, read, and subscribed to for updates.

### Prompts
Define reusable prompt templates that clients can retrieve and use. Supports dynamic prompt generation with argument substitution.

### Sampling/Completions
Request LLM completions from the client, enabling servers to perform AI-assisted operations.

### Tasks
Support long-running operations with status tracking, cancellation, and progress reporting.

### Logging
Structured logging system with multiple severity levels (DEBUG, INFO, NOTICE, WARNING, ERROR, CRITICAL, ALERT, EMERGENCY) and optional file output.

### Progress Notifications
Real-time progress updates for long-running operations with customizable progress tokens.

### Elicitation
Request structured input from clients using JSON schemas for validation.

## Architecture

The library is built around a context model pattern where you implement the `IContextModel` interface to define your server's behavior:

- `onClientListInformation`: Provide server metadata
- `onClientListTools`: Expose available tools
- `onClientCallTool`: Handle tool execution
- `onClientListResources`: Expose available resources
- `onClientReadResource`: Handle resource access
- `onClientListPrompts`: Expose available prompts
- `onClientGetPrompt`: Handle prompt retrieval
- `onClientRequestsCompletion`: Handle completion requests
- `onClientConnect`: Initialize on client connection
- `onClientRootsChanged`: Handle client root changes

## Exports

The library provides multiple entry points for different use cases:

- **Main export** (`.`): Core `EasyMCPServer` class and configuration interfaces
- **types** (`./types`): TypeScript interfaces and type definitions for all protocol structures
- **utils** (`./utils`): Utility functions including `crashIfNot` for validation and `memoize` for optimization
- **validators** (`./validators`): Request and response validation functions for all protocol methods
- **transports** (`./transports`): Transport layer implementations (stdio)
- **enums** (`./enums`): Enumeration types for protocol constants (LogLevel, TaskStatus, ContextModelEntityType)

## Configuration Options

The server supports extensive configuration through the `IEasyMCPConfig` interface:

- `protocol`: Select MCP protocol version
- `timeout`: Default request timeout
- `completionAttemptTimeout`: Timeout for completion requests
- `elicitationAttemptTimeout`: Timeout for elicitation requests
- `server.sendToolsListChangedNotification`: Enable tool list change notifications
- `server.sendPromptsListChangedNotification`: Enable prompt list change notifications
- `server.sendResourcesListChangedNotification`: Enable resource list change notifications
- `server.sendResourcesUpdatedNotification`: Enable individual resource update notifications
- `server.allowClientSubscribeToIndividualResourceUpdate`: Allow resource subscriptions
- `server.sendLogs`: Enable logging capability
- `server.logsFilePath`: File path for log output
- `server.supportsCompletion`: Enable completion/sampling capability

## License

MIT License - Copyright (c) 2026 mcpbay
