import { Request, Response, NextFunction } from 'express'
import engramClient from '../../services/engramClient'

const getContext = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project, limit } = req.query as { project?: string; limit?: string }
        const context = await engramClient.getContext(project, limit ? parseInt(limit) : undefined)
        return res.json(context)
    } catch (error) {
        next(error)
    }
}

export default {
    getContext
}
