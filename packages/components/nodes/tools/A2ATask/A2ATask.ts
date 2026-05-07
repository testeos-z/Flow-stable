import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { createAdapter } from '../A2AStorage/A2AStorageFactory'
import { TaskCreateTool, TaskGetTool, TaskStatusTool, TaskListTool, MessageSendTool, MessageGetTool } from './core'
import type { A2AStorageAdapter } from '../../../src/A2AStorageAdapter'

/**
 * A2A Task/Message — Manage agent tasks with state machine and messaging
 */
class A2ATask_Tools implements INode {
    label = 'A2A Task/Message'
    name = 'a2aTask'
    version = 1.0
    type = 'A2ATask'
    icon = 'a2atask.svg'
    category = 'Tools'
    description = 'Manage A2A tasks with state machine (submitted→working→completed) and message exchange between agents'
    baseClasses = [this.type, ...getBaseClasses(TaskCreateTool)]
    badge = ''

    loadMethods: Record<string, (nodeData: INodeData, options?: ICommonObject) => Promise<INodeOptionsValue[]>> = {}

    inputs: INodeParams[] = [
        {
            label: 'Storage Backend',
            name: 'storageBackend',
            type: 'options',
            options: [
                { label: 'Local JSON', name: 'localjson' },
                { label: 'Supabase', name: 'supabase' },
                { label: 'PostgreSQL', name: 'postgres' },
                { label: 'SQLite', name: 'sqlite' }
            ],
            default: 'localjson'
        },
        {
            label: 'Operation',
            name: 'operation',
            type: 'options',
            options: [
                { label: 'Create Task', name: 'create' },
                { label: 'Get Task', name: 'get' },
                { label: 'Update Status', name: 'updateStatus' },
                { label: 'List Tasks', name: 'list' },
                { label: 'Send Message', name: 'sendMessage' },
                { label: 'Get Messages', name: 'getMessages' }
            ],
            default: 'list'
        },
        {
            label: 'Supabase Project URL',
            name: 'supabaseProjUrl',
            type: 'string',
            optional: true,
            additionalParams: true
        }
    ]

    credential: INodeParams = {
        label: 'Connect Credential',
        name: 'credential',
        type: 'credential',
        credentialNames: ['supabaseApi'],
        optional: true
    }

    async init(nodeData: INodeData, _input: string, options: ICommonObject): Promise<any> {
        const storageBackend = (nodeData.inputs?.storageBackend as string) || 'localjson'
        const operation = (nodeData.inputs?.operation as string) || 'list'

        const config: Record<string, unknown> = {}
        if (nodeData.inputs?.supabaseProjUrl) {
            config.supabaseProjUrl = nodeData.inputs.supabaseProjUrl
        }
        if (options) {
            Object.assign(config, options)
        }

        const adapter: A2AStorageAdapter = await createAdapter(storageBackend, config)

        switch (operation) {
            case 'create':
                return new TaskCreateTool(adapter)
            case 'get':
                return new TaskGetTool(adapter)
            case 'updateStatus':
                return new TaskStatusTool(adapter)
            case 'list':
                return new TaskListTool(adapter)
            case 'sendMessage':
                return new MessageSendTool(adapter)
            case 'getMessages':
                return new MessageGetTool(adapter)
            default:
                throw new Error(`Unknown operation: ${operation}. Valid options: create, get, updateStatus, list, sendMessage, getMessages`)
        }
    }
}

module.exports = { nodeClass: A2ATask_Tools }
