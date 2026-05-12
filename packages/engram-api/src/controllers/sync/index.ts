import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import engramClient from '../../services/engramClient'

const syncToCloud = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project } = req.body as { project: string }
        if (!project) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Project is required' })
        }
        const result = await engramClient.syncToCloud(project)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

const getCloudStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project } = req.query as { project?: string }
        if (!project) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Project query parameter is required' })
        }
        const status = await engramClient.getCloudStatus(project)
        return res.json(status)
    } catch (error) {
        next(error)
    }
}

export default {
    syncToCloud,
    getCloudStatus
}
