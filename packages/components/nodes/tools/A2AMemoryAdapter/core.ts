import { FlowiseMemory, IMessage, IDatabaseEntity } from '../../../src/Interface'
import { BaseMessage } from '@langchain/core/messages'
import { DataSource } from 'typeorm'
import { mapChatMessageToBaseMessage } from '../../../src/utils'
import type { A2AStorageAdapter } from '../../../src/A2AStorageAdapter'

interface A2AStorageMemoryInit {
    sessionId: string
    memoryKey: string
    returnMessages: boolean
    appDataSource: DataSource
    databaseEntities: IDatabaseEntity
    chatflowid: string
    orgId: string
    adapter: A2AStorageAdapter
}

/**
 * Hybrid memory that bridges Flowise BufferMemory (conversation history)
 * with A2AStorageAdapter (structured context: claims, decisions, observations).
 */
export class A2AStorageMemory extends FlowiseMemory {
    appDataSource: DataSource
    databaseEntities: IDatabaseEntity
    chatflowid: string
    orgId: string
    sessionId = ''
    private adapter: A2AStorageAdapter

    constructor(fields: A2AStorageMemoryInit) {
        super({
            returnMessages: fields.returnMessages ?? true,
            memoryKey: fields.memoryKey ?? 'a2a_context'
        })
        this.sessionId = fields.sessionId
        this.appDataSource = fields.appDataSource
        this.databaseEntities = fields.databaseEntities
        this.chatflowid = fields.chatflowid
        this.orgId = fields.orgId
        this.adapter = fields.adapter
    }

    /** Read conversation history from Flowise DB (standard BufferMemory behavior) */
    async getChatMessages(
        overrideSessionId = '',
        returnBaseMessages = false,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]> {
        const id = overrideSessionId || this.sessionId
        if (!id) return []

        const chatMessage = await this.appDataSource.getRepository(this.databaseEntities['ChatMessage']).find({
            where: { sessionId: id, chatflowid: this.chatflowid },
            order: { createdDate: 'ASC' }
        })

        if (prependMessages?.length) chatMessage.unshift(...prependMessages)

        if (returnBaseMessages) {
            return await mapChatMessageToBaseMessage(chatMessage, this.orgId)
        }

        return chatMessage.map((m) => ({ message: m.content as string, type: m.role }))
    }

    /** Chat message persistence handled by Flowise server */
    async addChatMessages(): Promise<void> {}
    async clearChatMessages(): Promise<void> {}

    /** Save structured A2A context */
    async saveA2AContext(key: string, value: unknown): Promise<void> {
        await this.adapter.saveContext(this.sessionId || 'default', key, value)
    }

    /** Load structured A2A context */
    async loadA2AContext(key: string): Promise<unknown | null> {
        return this.adapter.loadContext(this.sessionId || 'default', key)
    }
}
