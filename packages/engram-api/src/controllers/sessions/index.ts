import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import engramClient from '../../services/engramClient'
import { EngramSession } from '../../types/engram'

const startSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body as EngramSession
        if (!body.project) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: 'Project name is required'
            })
        }
        const session = await engramClient.startSession(body)
        return res.status(StatusCodes.CREATED).json(session)
    } catch (error) {
        next(error)
    }
}

const endSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.body as { id: string }
        if (!id) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Session ID is required' })
        }
        const session = await engramClient.endSession(id)
        return res.json(session)
    } catch (error) {
        next(error)
    }
}

const saveSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, summary } = req.body as { id: string; summary: string }
        if (!id || !summary) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Session ID and summary are required' })
        }
        await engramClient.saveSessionSummary(id, summary)
        return res.status(StatusCodes.NO_CONTENT).send()
    } catch (error) {
        next(error)
    }
}

const getSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Note: Engram HTTP API may not expose individual session GET.
        // This is a placeholder that returns 501 if not implemented by Engram backend.
        return res.status(StatusCodes.NOT_IMPLEMENTED).json({
            error: 'Individual session retrieval not implemented in Engram HTTP API'
        })
    } catch (error) {
        next(error)
    }
}

export default {
    startSession,
    endSession,
    saveSummary,
    getSession
}
