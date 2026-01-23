/// <reference lib="deno.ns" />
import { getStringUid } from "@online/get-string-uid";
import { isUndefined } from "@online/is";
import type { Transport } from "./src/abstractions/mod.ts";
import {
  INTERNAL_ERROR,
  INVALID_PARAMS,
  METHOD_NOT_FOUND,
} from "./src/constants/mod.ts";
import { RequestException } from "./src/exceptions/mod.ts";
import {
  elicitationCompleteNotification,
  elicitationCreateRequest,
  errorResponse,
  loggingNotification,
  progressNotification,
  promptsListChangedNotification,
  resourcesListChangedNotification,
  resourcesUpdatedNotification,
  rootsListRequest,
  samplingCreateMessageRequest,
  successResponse,
  tasksStatusNotification,
  toolsListChangedNotification,
} from "./src/generators/mod.ts";
import type {
  ICapabilities,
  IClientMinimalRequestStructure,
  ICompletionCompleteResponse,
  ICompletionMessageResponse,
  IContextModel,
  IContextModelOptions,
  IElicitationCreateResponse,
  IGenericRequest,
  IInitializeResponse,
  ILoggingSetLevelResponse,
  ILogOptions,
  IPingResponse,
  IProgressOptions,
  IPromptsGetResponse,
  IPromptsListResponse,
  IRequestParamsMetadata,
  IResourcesListResponse,
  IResourcesReadResponse,
  IResourcesSubscribeResponse,
  IRootsListResponse,
  ITasksCreateResponse,
  ITasksListResponse,
  ITaskState,
  IToolContextModelOptions,
  IToolsCallResponse,
  IToolsListResponse,
  LogFunction,
} from "./src/interfaces/mod.ts";
import type {
  IMessageHandlerClass,
  ProtocolVersion,
  RequestId,
} from "./src/types/mod.ts";
import { crashIfNot, textToSlug } from "./src/utils/mod.ts";
import {
  isCancelledNotification,
  isCompletionCompleteRequest,
  isGenericRequest,
  isGenericResultResponse,
  isInitializedNotification,
  isInitializeRequest,
  isLoggingSetLevelRequest,
  isPingRequest,
  isPromptsGetRequest,
  isPromptsListRequest,
  isResourcesListRequest,
  isResourcesReadRequest,
  isResourcesSubscribeRequest,
  isRootsListChangedNotification,
  isTasksCancelRequest,
  isTasksGetRequest,
  isTasksListRequest,
  isTasksResultRequest,
  isToolsCallRequest,
  isToolsListRequest,
} from "./src/validators/mod.ts";
import {
  ContextModelEntityType,
  LogLevel,
  TaskStatus,
} from "./src/enums/mod.ts";
import fs from "node:fs";
import { getUuid } from "./src/utils/get-uuid.util.ts";

const LOG_LEVELS: LogLevel[] = [
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.NOTICE,
  LogLevel.WARNING,
  LogLevel.ERROR,
  LogLevel.CRITICAL,
  LogLevel.ALERT,
  LogLevel.EMERGENCY,
];

const TASK_TERMINAL_STATUS: TaskStatus[] = [
  TaskStatus.CANCELLED,
  TaskStatus.COMPLETED,
  TaskStatus.FAILED,
];

const SUPPORTED_PROTOCOL_VERSIONS: readonly ProtocolVersion[] = Object.freeze<
  ProtocolVersion[]
>([
  "2024-11-05",
  "2025-03-26",
  "2025-06-18",
  "2025-11-25",
]);
const DEFAULT_PROTOCOL_VERSION: ProtocolVersion = "2025-11-25" as const;
const DEFAULT_CAPABILITIES: ICapabilities = Object.freeze<ICapabilities>(
  {
    completions: { listChanged: false },
    prompts: { listChanged: true },
    resources: { listChanged: true, subscribe: true },
    tools: { listChanged: true },
    roots: { listChanged: false },
    sampling: {},
    logging: {},
  } as const,
);

export interface IEasyMCPConfig {
  protocol: ProtocolVersion;
  timeout: number;
  completionAttemptTimeout: number;
  elicitationAttemptTimeout: number;
  server: Partial<{
    sendToolsListChangedNotification: boolean;
    sendPromptsListChangedNotification: boolean;
    sendResourcesListChangedNotification: boolean;
    sendResourcesUpdatedNotification: boolean;
    allowClientSubscribeToIndividualResourceUpdate: boolean;
    sendLogs: boolean;
    logsFilePath: string;
    supportsCompletion: boolean;
  }>;
}

enum DeeferedPromiseType {
  COMPLETION = "completion",
  ROOTING = "rooting",
  ELICITATION = "elicitation",
}

export class EasyMCPServer implements IMessageHandlerClass {
  private uniqueId = 1;
  private logLevel: LogLevel | undefined;
  private protocolVersion: ProtocolVersion = DEFAULT_PROTOCOL_VERSION;

  private readonly tasks = new Map<
    string,
    {
      state: ITaskState;
      abortController: AbortController;
      response?: object;
      promise?: Promise<IToolsCallResponse["result"]["content"]>;
    }
  >();
  private readonly jobs = new Map<RequestId, AbortController>();
  private readonly resourceSubscriptions = new Set<string>();
  private readonly capabilities: ICapabilities = DEFAULT_CAPABILITIES;
  private readonly defeeredPromises = new Map<RequestId, {
    type: DeeferedPromiseType;
    resolve:
      | ((value: ICompletionMessageResponse["result"]) => void)
      | ((value: IElicitationCreateResponse["result"]) => void)
      | ((value: IRootsListResponse["result"]["roots"]) => void);
    reject: (reason?: any) => void;
  }>();

  constructor(
    private readonly transport: Transport,
    private readonly contextModel: IContextModel,
    private readonly config?: Partial<IEasyMCPConfig>,
  ) {
    this.protocolVersion = config?.protocol ?? DEFAULT_PROTOCOL_VERSION;
    Object.assign(this, {
      capabilities: {
        completions: config?.server?.supportsCompletion ? {} : void 0,
        prompts: {
          listChanged: config?.server?.sendPromptsListChangedNotification ??
            true,
        },
        resources: {
          listChanged: config?.server?.sendResourcesListChangedNotification ??
            true,
          subscribe:
            config?.server?.allowClientSubscribeToIndividualResourceUpdate ??
              true,
        },
        tools: {
          listChanged: config?.server?.sendToolsListChangedNotification ?? true,
        },
        roots: { listChanged: false },
        sampling: {},
        logging: (config?.server?.sendLogs ?? true) ? {} : void 0,
      } satisfies ICapabilities,
    });
  }

  // A wrapper to set the `AbortController` on every `ContextModel` event.
  async messageHandler(message: object) {
    const abortController = new AbortController();
    const possibleId: RequestId | undefined =
      (message as IClientMinimalRequestStructure)?.id;

    setTimeout(
      () => {
        abortController.abort();
      },
      this.config?.timeout || 10000,
    );

    abortController.signal.addEventListener("abort", () => {
      if (!possibleId) {
        return;
      }

      this.transport.send(errorResponse(possibleId, {
        code: INTERNAL_ERROR,
        message: "Request timed out",
      }));
    });

    const isCancellableRequest = isGenericRequest(message) &&
      !isInitializeRequest(message);

    try {
      if (isCancellableRequest) {
        this.registerRequestJob(message.id, abortController);
      }

      await this.internalMessageHandler(message, abortController);
    } catch (e) {
      if (e instanceof RequestException) {
        if (isUndefined(possibleId)) {
          return;
        }

        this.transport.send(errorResponse(possibleId, {
          code: e.status,
          message: e.message,
          data: e.data,
        }));
      }
    } finally {
      if (isCancellableRequest) {
        this.unregisterRequestJob(message.id);
      }
    }
  }

  private loggerFactory(logLevel: LogLevel) {
    return (message: string, options?: Partial<ILogOptions>) => {
      if (
        isUndefined(this.logLevel) || !this.capabilities.logging ||
        LOG_LEVELS.indexOf(logLevel) > LOG_LEVELS.indexOf(this.logLevel)
      ) {
        return;
      }

      if (this.config?.server?.logsFilePath) {
        const paddedLogLevel = logLevel.padEnd(10, " ");

        fs.appendFileSync(
          this.config?.server?.logsFilePath,
          `${paddedLogLevel} ${message}\n`,
        );
      }

      this.transport.send(
        loggingNotification(
          logLevel,
          { message, details: options?.details },
          options?.logger,
        ),
      );
    };
  }

  private async internalMessageHandler(
    message: object,
    abortController: AbortController,
  ) {
    const contextOptions: IContextModelOptions = {
      abortController,
      progress: async (
        value: number,
        options: Partial<IProgressOptions> = {},
      ) => {
        const { total = 1, message: progressMessage } = options;
        const progressToken =
          ((message as IGenericRequest).params as IRequestParamsMetadata)._meta
            ?.progressToken;

        crashIfNot(value >= 0 && value <= total, {
          code: INVALID_PARAMS,
          message: `Progress value must be between 0 and ${total}`,
        });

        // if (!isUndefined(total)) {
        //   crashIfNot(total > 0 && total <= 1, {
        //     code: INVALID_PARAMS,
        //     message: "Progress total must be between 0 and 1",
        //   });
        // }

        if (!progressToken) {
          return;
        }

        await this.transport.send(
          progressNotification(progressToken, value, total, progressMessage),
        );
      },
      log: Object.fromEntries(
        Object
          .values(LogLevel)
          .map(
            (level) => [level, this.loggerFactory(level)],
          ),
      ) as Record<LogLevel, LogFunction>,
      notify: {
        elicitationComplete: (elicitationId: string) => {
          this.transport.send(elicitationCompleteNotification(elicitationId));
        },
        promptsListChanged: () => {
          crashIfNot(this.capabilities.prompts.listChanged, {
            code: INTERNAL_ERROR,
            message:
              "'sendPromptsListChangedNotification' server option is not enabled",
          });

          this.transport.send(promptsListChangedNotification());
        },
        resourceUpdated: (uri: string) => {
          crashIfNot(this.capabilities.resources.subscribe, {
            code: INTERNAL_ERROR,
            message:
              "'sendResourcesUpdatedNotification' server option is not enabled",
          });

          crashIfNot(this.resourceSubscriptions.has(uri), {
            code: INVALID_PARAMS,
            message: `Resource '${uri}' does not exist`,
          });

          this.transport.send(resourcesUpdatedNotification(uri));
        },
        resourcesListChanged: () => {
          crashIfNot(this.capabilities.resources.listChanged, {
            code: INTERNAL_ERROR,
            message:
              "'sendResourcesListChangedNotification' server option is not enabled",
          });

          this.transport.send(resourcesListChangedNotification());
        },
        toolsListChanged: () => {
          crashIfNot(this.capabilities.tools.listChanged, {
            code: INTERNAL_ERROR,
            message:
              "'sendToolsListChangedNotification' server option is not enabled",
          });

          this.transport.send(toolsListChangedNotification());
        },
      },
      createCompletion: (messages, options = { maxTokens: 100 }) => {
        crashIfNot(this.capabilities.sampling, {
          code: INTERNAL_ERROR,
          message: "Sampling capability is not enabled",
        });

        const uniqueId = this.getUniqueId();

        this.transport.send(samplingCreateMessageRequest(uniqueId, {
          messages,
          ...options,
        }));

        const resultPromise = new Promise<ICompletionMessageResponse["result"]>(
          (resolve, reject) => {
            this.defeeredPromises.set(uniqueId, {
              type: DeeferedPromiseType.COMPLETION,
              resolve,
              reject,
            });

            setTimeout(
              () =>
                reject(
                  new RequestException("Request timed out", INTERNAL_ERROR),
                ),
              this.config?.completionAttemptTimeout || 10000,
            );
          },
        );

        return resultPromise.finally(() =>
          this.defeeredPromises.delete(uniqueId)
        );
      },
      elicitate: (message: string, schema: object) => {
        crashIfNot(this.capabilities.elicitation, {
          message: "Elicitation capability is not enabled",
          code: INTERNAL_ERROR,
        });

        const uniqueId = this.getUniqueId();

        this.transport.send(
          elicitationCreateRequest(uniqueId, message, schema),
        );

        const resultPromise = new Promise<IElicitationCreateResponse["result"]>(
          (resolve, reject) => {
            this.defeeredPromises.set(uniqueId, {
              type: DeeferedPromiseType.ELICITATION,
              resolve,
              reject,
            });

            setTimeout(
              () =>
                reject(
                  new RequestException("Request timed out", INTERNAL_ERROR),
                ),
              this.config?.elicitationAttemptTimeout || 10000,
            );
          },
        );

        return resultPromise.finally(() =>
          this.defeeredPromises.delete(uniqueId)
        );
      },
      getClientRootsList: () => {
        const uniqueId = this.getUniqueId();

        this.transport.send(rootsListRequest(uniqueId));

        const resultPromise = new Promise<
          IRootsListResponse["result"]["roots"]
        >(
          (resolve, reject) => {
            this.defeeredPromises.set(uniqueId, {
              type: DeeferedPromiseType.COMPLETION,
              resolve,
              reject,
            });

            setTimeout(
              () =>
                reject(
                  new RequestException("Request timed out", INTERNAL_ERROR),
                ),
              this.config?.completionAttemptTimeout || 10000,
            );
          },
        );

        return resultPromise.finally(() =>
          this.defeeredPromises.delete(uniqueId)
        );
      },
    };

    switch (true) {
      case isInitializeRequest(message): {
        const { id, params } = message;
        const { protocolVersion: requestedProtocolVersion } = params;

        crashIfNot(
          SUPPORTED_PROTOCOL_VERSIONS.includes(requestedProtocolVersion),
          {
            code: INVALID_PARAMS,
            message: "Unsupported protocol version requested",
            data: {
              supported: SUPPORTED_PROTOCOL_VERSIONS,
              requested: requestedProtocolVersion,
            },
          },
        );

        this.setProtocolVersion(requestedProtocolVersion);

        const capabilities =
          (await this.contextModel.onClientListCapabilities?.(
            contextOptions,
          )) ??
            this.capabilities;

        const serverInfo = await this.contextModel.onClientListInformation(
          contextOptions,
        );

        const response = successResponse<IInitializeResponse["result"]>(
          id,
          {
            protocolVersion: this.protocolVersion,
            capabilities,
            serverInfo,
          },
        );

        this.setCapabilities(capabilities);
        await this.transport.send(response);
        break;
      }
      case isInitializedNotification(message): {
        this.initializeCommunication();
        await this.contextModel.onClientConnect?.(contextOptions);
        break;
      }
      case isCancelledNotification(message): {
        const { params } = message;
        this.cancelRequestJob(params.requestId);
        break;
      }
      case isPingRequest(message): {
        await this.transport.send(
          successResponse<IPingResponse["result"]>(message.id, {}),
        );
        break;
      }
      case isPromptsListRequest(message): {
        const { id, params } = message;
        const prompts = await this.contextModel.onClientListPrompts?.(
          contextOptions,
        );

        crashIfNot(prompts, { code: INTERNAL_ERROR, message: "No prompts" });

        if (params) {
          const { cursor } = params;
          const cursorIndex = prompts.findIndex((p) =>
            String(getStringUid(p.name)) === cursor
          );

          if (cursorIndex !== -1) {
            prompts.splice(cursorIndex, cursorIndex + 100);
          }
        }

        prompts.splice(100);

        await this.transport.send(
          successResponse<IPromptsListResponse["result"]>(id, { prompts }),
        );
        break;
      }
      case isPromptsGetRequest(message): {
        const { id, params } = message;
        const { name: promptName, arguments: promptArgs } = params;
        const prompts = await this.contextModel.onClientListPrompts?.(
          contextOptions,
        );

        crashIfNot(prompts, { code: INTERNAL_ERROR, message: "No prompts" });

        const prompt = prompts.find((p) =>
          textToSlug(p.name) === textToSlug(promptName)
        );

        crashIfNot(prompt, { code: INVALID_PARAMS, message: "No prompt" });

        const promptResponse = await this.contextModel.onClientGetPrompt?.(
          prompt,
          promptArgs ?? {},
          contextOptions,
        );

        crashIfNot(promptResponse, {
          code: INTERNAL_ERROR,
          message: "No prompt messages",
        });

        await this.transport.send(
          successResponse<IPromptsGetResponse["result"]>(id, promptResponse),
        );
        break;
      }
      case isToolsListRequest(message): {
        const { id, params } = message;
        const tools = (await this.contextModel.onClientListTools?.(
          contextOptions,
        )) ?? [];

        crashIfNot(tools, { code: INTERNAL_ERROR, message: "No prompts" });

        if (params) {
          const { cursor } = params;
          const cursorIndex = tools.findIndex((p) =>
            String(getStringUid(p.name)) === cursor
          );

          if (cursorIndex !== -1) {
            tools.splice(cursorIndex, cursorIndex + 100);
          }
        }

        tools.splice(100);

        await this.transport.send(
          successResponse<IToolsListResponse["result"]>(id, { tools }),
        );
        break;
      }
      case isToolsCallRequest(message): {
        const { id, params } = message;
        const { name: toolName, arguments: toolArgs, task } = params;
        const tools = await this.contextModel.onClientListTools?.(
          contextOptions,
        );

        crashIfNot(tools, { code: INTERNAL_ERROR, message: "No tools" });

        const tool = tools.find((p) =>
          textToSlug(p.name) === textToSlug(toolName)
        );

        crashIfNot(tool, { code: INVALID_PARAMS, message: "No tool" });

        const taskId = getUuid();
        const isTaskPresent = !isUndefined(task);
        const _abortController = new AbortController();

        if (isTaskPresent) {
          crashIfNot(
            tool.execution?.taskSupport ||
              tool.execution?.taskSupport !== "forbidden",
            {
              code: INVALID_PARAMS,
              message: "Tool does not support tasks",
            },
          );

          const createdAt = new Date().toISOString();
          const state: ITaskState = {
            taskId,
            createdAt,
            lastUpdatedAt: createdAt,
            pollInterval: 5000,
            status: TaskStatus.WORKING,
            ttl: task.ttl ?? 15000,
            statusMessage: "The task has started",
          };

          // TODO: Modify
          this.tasks.set(taskId, { state, abortController: _abortController });

          await this.transport.send(
            successResponse<ITasksCreateResponse["result"]>(id, {
              task: state,
            }),
          );
        }

        const toolContextOptions: IToolContextModelOptions = {
          ...contextOptions,
          abortSignal: _abortController.signal,
          continueTask: (reason) => {
            if (!isTaskPresent) {
              return;
            }

            crashIfNot(this.getTaskStatus(taskId) !== "working", {
              code: INTERNAL_ERROR,
              message: `Task '${taskId}' is not working`,
            });

            this.updateTaskState(taskId, {
              status: TaskStatus.WORKING,
              statusMessage: reason ?? "Task working",
            });

            this.transport.send(
              tasksStatusNotification(this.tasks.get(taskId)!.state),
            );
          },
          // TODO: Implement
          requireInput: async () => {
            if (!isTaskPresent) {
              return;
            }
          },
        };

        const toolCall = this.contextModel.onClientCallTool?.(
          tool,
          toolArgs ?? {},
          toolContextOptions,
        );

        if (toolCall) {
          toolCall
            .then((result) => {
              this.updateTaskState(taskId, {
                status: TaskStatus.COMPLETED,
              });

              this.updateTaskResponse(taskId, result);
            })
            .catch((e) => {
              this.updateTaskState(taskId, {
                status: TaskStatus.FAILED,
              });

              const taskErrorResponse = errorResponse(id, {
                code: e.status,
                message: e.message,
                data: e.data,
              });

              this.updateTaskResponse(taskId, taskErrorResponse);
            })
            .finally(() => {
              if (!isTaskPresent) {
                return;
              }

              crashIfNot(
                TASK_TERMINAL_STATUS.includes(
                  this.getTaskStatus(taskId),
                ),
                {
                  code: INTERNAL_ERROR,
                  message:
                    `Task '${taskId}' status must be 'accepted', 'failed' or 'cancelled' when finished.`,
                },
              );

              this.tasks.delete(taskId);
            });

          this.updateTaskPromise(taskId, toolCall);
        }

        if (!isTaskPresent) {
          const toolResponse = await toolCall;

          crashIfNot(toolResponse, {
            code: INTERNAL_ERROR,
            message: "No tool messages",
          });

          await this.transport.send(
            successResponse<IToolsCallResponse["result"]>(id, {
              content: toolResponse,
              isError: false,
              _meta: {
                "io.modelcontextprotocol/related-task": { taskId },
              },
            }),
          );
        }
        break;
      }
      case isTasksCancelRequest(message): {
        const { id, params } = message;
        const { taskId } = params;

        crashIfNot(this.tasks.has(taskId), {
          code: INVALID_PARAMS,
          message: `Task '${taskId}' not found`,
        });

        const task = this.tasks.get(params.taskId)!;

        crashIfNot(TASK_TERMINAL_STATUS.includes(task.state.status), {
          code: INVALID_PARAMS,
          message:
            `Cannot cancel task: already in terminal status '${task.state.status}'.`,
        });

        task.abortController.abort();

        const updatedTask = this.updateTaskState(taskId, {
          status: TaskStatus.CANCELLED,
          statusMessage: `Task '${taskId}' cancelled by client`,
        });

        await this.transport.send(
          successResponse<ITaskState>(id, updatedTask.state),
        );
        break;
      }
      case isTasksListRequest(message): {
        const { id, params } = message;
        const tasks = [...this.tasks.values()].map((task) => task.state);

        if (params) {
          const { cursor } = params;
          const cursorIndex = tasks.findIndex((p) =>
            String(getStringUid(p.taskId)) === cursor
          );

          if (cursorIndex !== -1) {
            tasks.splice(cursorIndex, cursorIndex + 100);
          }
        }

        tasks.splice(100);

        await this.transport.send(
          successResponse<ITasksListResponse["result"]>(id, {
            tasks,
          }),
        );
        break;
      }
      case isTasksResultRequest(message): {
        const { id, params } = message;
        const { taskId } = params;

        crashIfNot(this.tasks.has(taskId), {
          code: INVALID_PARAMS,
          message: `Task '${taskId}' not found`,
        });

        const task = this.tasks.get(taskId)!;

        // Check this!
        if (TASK_TERMINAL_STATUS.includes(task.state.status)) {
          return this.transport.send(task.response!);
        }

        const taskSuccessResponse = await task.promise;

        await this.transport.send(
          successResponse<IToolsCallResponse["result"]>(id, {
            content: taskSuccessResponse!,
            isError: false,
            _meta: {
              "io.modelcontextprotocol/related-task": { taskId },
            },
          }),
        );
        break;
      }
      case isTasksGetRequest(message): {
        const { id, params } = message;
        const { taskId } = params;

        crashIfNot(this.tasks.has(taskId), {
          code: INVALID_PARAMS,
          message: `Task '${taskId}' not found`,
        });

        const task = this.tasks.get(taskId)!;

        await this.transport.send(successResponse<ITaskState>(id, task.state));
        break;
      }
      case isCompletionCompleteRequest(message): {
        // Specific case, due the first version of the MCP procol does supports completions requests.
        if (this.protocolVersion !== "2024-11-05") {
          this.requireAtLeastVersion(
            "2025-03-26",
            "The protocol version is too old to support completions requests.",
          );

          // I do put this here due the protocol version "2024-11-05" does not support capability check for this request
          crashIfNot(this.capabilities.completions, {
            code: METHOD_NOT_FOUND,
            message:
              "'sendCompletionCompleteRequest' server option is not enabled",
          });
        }

        const { id, params } = message;
        const { ref, argument } = params;
        const completion = await this.contextModel.onClientRequestsCompletion?.(
          ref.type === "ref/prompt"
            ? ContextModelEntityType.PROMPT
            : ContextModelEntityType.RESOURCE,
          argument,
          contextOptions,
        );

        if (isUndefined(completion)) {
          return this.transport.send(
            successResponse<ICompletionCompleteResponse["result"]>(id, {
              completion: {
                values: [],
                hasMore: false,
                total: 0,
              },
            }),
          );
        }

        completion.values = completion.values
          .sort((a, b) => a.localeCompare(b))
          .splice(0, 100);
        completion.total = completion.values.length;

        await this.transport.send(
          successResponse<ICompletionCompleteResponse["result"]>(id, {
            completion,
          }),
        );
        break;
      }
      case isResourcesListRequest(message): {
        const { id, params } = message;
        const resources = await this.contextModel.onClientListResources?.(
          contextOptions,
        );

        crashIfNot(resources, {
          code: INTERNAL_ERROR,
          message: "No resources",
        });

        if (params) {
          const { cursor } = params;
          const cursorIndex = resources.findIndex((p) =>
            String(getStringUid(p.name)) === cursor
          );

          if (cursorIndex !== -1) {
            resources.splice(cursorIndex, cursorIndex + 100);
          }
        }

        resources.splice(100);

        await this.transport.send(
          successResponse<IResourcesListResponse["result"]>(id, { resources }),
        );
        break;
      }
      case isResourcesReadRequest(message): {
        const { id, params } = message;
        const { uri } = params;
        const resource = await this.contextModel.onClientReadResource?.(
          uri,
          contextOptions,
        );

        crashIfNot(resource, {
          code: INVALID_PARAMS,
          message: "No resource",
          data: { uri },
        });

        await this.transport.send(
          successResponse<IResourcesReadResponse["result"]>(id, {
            contents: resource,
          }),
        );
        break;
      }
      case isLoggingSetLevelRequest(message): {
        const { id, params } = message;

        crashIfNot(Object.values(LogLevel).includes(params.level), {
          message: "Invalid log level",
          code: INVALID_PARAMS,
        });

        this.setLogLevel(params.level);
        await this.transport.send(
          successResponse<ILoggingSetLevelResponse["result"]>(id, {}),
        );
        break;
      }
      case isResourcesSubscribeRequest(message): {
        const { id, params } = message;
        const { uri } = params;

        this.registerResourceSubscription(uri);
        await this.transport.send(
          successResponse<IResourcesSubscribeResponse["result"]>(id, {}),
        );
        break;
      }
      case isRootsListChangedNotification(message): {
        this.contextModel.onClientRootsChanged?.(contextOptions);
        break;
      }
      case isGenericResultResponse(message): {
        const { id, result } = message;
        const defeeredPromise = this.getDeeferedPromiseById(id);

        crashIfNot(defeeredPromise, {
          code: INVALID_PARAMS,
          message: `No request found related with id '${id}'`,
        });

        if (defeeredPromise.type === DeeferedPromiseType.COMPLETION) {
          const completion = result as ICompletionMessageResponse["result"];

          // I had to use `ICompletionMessageResponse["result"] & IRoot[] & { action: "cancel"; }`... I wont type that sh*t.
          defeeredPromise.resolve(completion as any);
        } else if (defeeredPromise.type === DeeferedPromiseType.ROOTING) {
          const { roots } = result as IRootsListResponse["result"];

          // Same thing here...
          defeeredPromise.resolve(roots as any);
        } else if (defeeredPromise.type === DeeferedPromiseType.ELICITATION) {
          const elicitationResponse =
            result as IElicitationCreateResponse["result"];

          // I hate `any`, but here works. Don't use it if you don't know what you're doing!
          defeeredPromise.resolve(elicitationResponse as any);
        }
        break;
      }
      default: {
        if (isGenericRequest(message)) {
          const { method } = message;

          crashIfNot(false, {
            code: INTERNAL_ERROR,
            message: `Invalid request method: ${method}`,
          });
        }
        break;
      }
    }
  }

  public async start() {
    await this.transport.onInitialize(this);
  }

  private registerRequestJob(id: RequestId, abortController: AbortController) {
    this.jobs.set(id, abortController);
  }

  private unregisterRequestJob(id: RequestId) {
    this.jobs.delete(id);
  }

  private cancelRequestJob(id: RequestId) {
    this.jobs.get(id)?.abort();
    this.jobs.delete(id);
  }

  private registerResourceSubscription(uri: string) {
    this.resourceSubscriptions.add(uri);
  }

  private setLogLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  private setProtocolVersion(protocolVersion: ProtocolVersion) {
    this.protocolVersion = protocolVersion;
  }

  private setCapabilities(capabilities: ICapabilities) {
    Object.assign(this, { capabilities });
  }

  private initializeCommunication() {
    Object.assign(this, { isCommuncationInitialized: true });
  }

  private getUniqueId() {
    return this.uniqueId++;
  }

  private getDeeferedPromiseById(id: RequestId) {
    return this.defeeredPromises.get(id);
  }

  private requireAtLeastVersion(
    protocolVersion: ProtocolVersion,
    message: string,
  ) {
    crashIfNot(
      SUPPORTED_PROTOCOL_VERSIONS.indexOf(this.protocolVersion) <
        SUPPORTED_PROTOCOL_VERSIONS.indexOf(protocolVersion),
      {
        code: METHOD_NOT_FOUND,
        message,
        data: {
          currentProtocolVersion: this.protocolVersion,
          requiredProtocolVersion: protocolVersion,
        },
      },
    );
  }

  private getTaskStatus(taskId: string) {
    return this.tasks.get(taskId)!.state.status;
  }

  private updateTaskState(taskId: string, update: Partial<ITaskState>) {
    const task = this.tasks.get(taskId)!;
    const updatedTask = {
      ...task,
      state: {
        ...task.state,
        ...update,
        lastUpdatedAt: new Date().toISOString(),
      },
    };
    this.tasks.set(taskId, updatedTask);

    return updatedTask;
  }

  private updateTaskResponse(taskId: string, response: object) {
    const task = this.tasks.get(taskId)!;
    this.tasks.set(taskId, {
      ...task,
      response,
    });
  }

  private updateTaskPromise(taskId: string, promise: Promise<any>) {
    const task = this.tasks.get(taskId)!;
    this.tasks.set(taskId, {
      ...task,
      promise,
    });
  }
}
