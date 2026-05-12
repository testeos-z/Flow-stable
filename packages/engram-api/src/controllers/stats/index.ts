import { Request, Response, NextFunction } from 'express'
import engramClient from '../../services/engramClient'

const getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project } = req.query as { project?: string }
        const stats = await engramClient.getStats(project)
        return res.json(stats)
    } catch (error) {
        next(error)
    }
}

export default {
    getStats
}
