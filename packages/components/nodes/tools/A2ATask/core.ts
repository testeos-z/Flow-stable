import { z } from 'zod/v3'
import { StructuredTool } from '@langchain/core/tools'
import { A2AStorageAdapter, A2AMessageSchema, A2AFilterSchema } from '../../../src/A2AStorageAdapter'
import type { A2ATask, A2AMessage, A2AFilter, TaskStatus } from '../../../src/A2AStorageAdapter'

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    submitted: ['working', 'canceled'],
    working: ['completed', 'failed', 'canceled'],
    completed: [],
    failed: [],
    canceled: []
}

function validateTransition(current: TaskStatus, next: TaskStatus): void {
    if (!VALID_TRANSITIONS[current].includes(next)) {
        throw new Error(
            `Invalid A2A task status transition: ${current} → ${next}. ` +
                `Valid transitions from ${current}: ${VALID_TRANSITIONS[current].join(', ') || 'none (terminal state)'}`
        )
    }
}

// ---------------------------------------------------------------------------
// TaskCreateTool
// ---------------------------------------------------------------------------

export class TaskCreateTool extends StructuredTool {
    name = 'a2a_task_create'
    description =
        'Create a new A2A task for an agent. Provide title, description, requesterId, and optionally assigneeId. ' +
        'The task starts in "submitted" status. Returns the task ID.'

    schema = z.object({
        title: z.string().min(1).max(256).describe('Task title'),
        description: z.string().max(4096).optional().default('').describe('Task description'),
        requesterId: z.string().uuid().describe('The UUID of the agent requesting the task'),
        assigneeId: z.string().uuid().optional().describe('The UUID of the agent assigned to the task'),
        sessionId: z.string().uuid().optional().describe('Optional deliberation session'),
        artifactIds: z.array(z.string().uuid()).optional().default([]),
        metadata: z.record(z.unknown()).optional().default({})
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        const task: A2ATask = {
            ...input,
            id: crypto.randomUUID(),
            status: 'submitted'
        } as A2ATask
        return this.adapter.createTask(task)
    }
}

// ---------------------------------------------------------------------------
// TaskGetTool
// ---------------------------------------------------------------------------

export class TaskGetTool extends StructuredTool {
    name = 'a2a_task_get'
    description = 'Retrieve an A2A task by its UUID. Returns the full task object including status, messages, and artifacts.'

    schema = z.object({
        taskId: z.string().uuid().describe('The UUID of the task to retrieve')
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<A2ATask | null> {
        return this.adapter.getTask(input.taskId)
    }
}

// ---------------------------------------------------------------------------
// TaskStatusTool
// ---------------------------------------------------------------------------

export class TaskStatusTool extends StructuredTool {
    name = 'a2a_task_update_status'
    description =
        'Update the status of an A2A task. ' +
        'Valid transitions: submitted→working|canceled, working→completed|failed|canceled. ' +
        'Completed, failed, and canceled are terminal states. ' +
        'The state machine is enforced — invalid transitions throw errors.'

    schema = z.object({
        taskId: z.string().uuid().describe('The UUID of the task to update'),
        status: z.enum(['submitted', 'working', 'completed', 'failed', 'canceled']).describe('The new status')
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        const task = await this.adapter.getTask(input.taskId)
        if (!task) throw new Error(`Task ${input.taskId} not found`)

        validateTransition(task.status, input.status)
        await this.adapter.updateTaskStatus(input.taskId, input.status)
        return `Task ${input.taskId} status updated: ${task.status} → ${input.status}`
    }
}

// ---------------------------------------------------------------------------
// TaskListTool
// ---------------------------------------------------------------------------

export class TaskListTool extends StructuredTool {
    name = 'a2a_task_list'
    description =
        'List A2A tasks matching the given filters. ' +
        'Filter by status (submitted|working|completed|failed|canceled), agentId (requester or assignee), ' +
        'or ownerId. Returns an array of matching tasks.'

    schema = A2AFilterSchema

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof A2AFilterSchema>): Promise<A2ATask[]> {
        return this.adapter.listTasks(input as A2AFilter)
    }
}

// ---------------------------------------------------------------------------
// MessageSendTool
// ---------------------------------------------------------------------------

export class MessageSendTool extends StructuredTool {
    name = 'a2a_message_send'
    description =
        'Send a message within an A2A task. Provide taskId, senderId, content, and role ' +
        '(instruction|query|response|status|error). Returns the message ID.'

    schema = A2AMessageSchema.omit({ id: true, timestamp: true })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        const message: A2AMessage = {
            ...input,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        } as A2AMessage
        return this.adapter.sendMessage(message)
    }
}

// ---------------------------------------------------------------------------
// MessageGetTool
// ---------------------------------------------------------------------------

export class MessageGetTool extends StructuredTool {
    name = 'a2a_message_get'
    description = 'Retrieve messages for an A2A task. Returns an array of messages ordered by timestamp.'

    schema = z.object({
        taskId: z.string().uuid().describe('The UUID of the task'),
        limit: z.number().min(1).max(100).optional().describe('Maximum messages to return')
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<A2AMessage[]> {
        return this.adapter.getMessages(input.taskId, input.limit)
    }
}
