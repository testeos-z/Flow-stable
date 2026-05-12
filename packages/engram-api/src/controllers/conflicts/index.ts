import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import engramClient from '../../services/engramClient'

const listConflicts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project, status } = req.query as { project?: string; status?: string }
        const conflicts = await engramClient.listConflicts(project, status)
        return res.json(conflicts)
    } catch (error) {
        next(error)
    }
}

const scanConflicts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project, dryRun, semantic, maxInsert } = req.body as {
            project: string
            dryRun?: boolean
            semantic?: boolean
            maxInsert?: number
        }
        if (!project) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Project is required' })
        }
        const conflicts = await engramClient.scanConflicts(project, { dryRun, semantic, maxInsert })
        return res.json(conflicts)
    } catch (error) {
        next(error)
    }
}

export default {
    listConflicts,
    scanConflicts
}
