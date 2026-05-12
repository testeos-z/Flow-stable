import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import engramClient from '../../services/engramClient'
import { EngramMemory } from '../../types/engram'

const createMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body as EngramMemory
        if (!body.title || !body.content) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: 'Title and content are required'
            })
        }
        const memory = await engramClient.saveMemory(body)
        return res.status(StatusCodes.CREATED).json(memory)
    } catch (error) {
        next(error)
    }
}

const getAllMemories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q, project, limit } = req.query as { q?: string; project?: string; limit?: string }
        const result = await engramClient.searchMemories(q || '', project, limit ? parseInt(limit) : undefined)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

const getMemoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid memory ID' })
        }
        const memory = await engramClient.getMemory(id)
        if (!memory) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Memory not found' })
        }
        return res.json(memory)
    } catch (error) {
        next(error)
    }
}

const updateMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid memory ID' })
        }
        const memory = await engramClient.updateMemory(id, req.body)
        return res.json(memory)
    } catch (error) {
        next(error)
    }
}

const deleteMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid memory ID' })
        }
        await engramClient.deleteMemory(id)
        return res.status(StatusCodes.NO_CONTENT).send()
    } catch (error) {
        next(error)
    }
}

export default {
    createMemory,
    getAllMemories,
    getMemoryById,
    updateMemory,
    deleteMemory
}
