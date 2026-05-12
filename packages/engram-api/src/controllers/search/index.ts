import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import engramClient from '../../services/engramClient'

const searchMemories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q, project, limit } = req.query as { q?: string; project?: string; limit?: string }
        if (!q) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: 'Query parameter "q" is required'
            })
        }
        const result = await engramClient.searchMemories(q, project, limit ? parseInt(limit) : undefined)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    searchMemories
}
