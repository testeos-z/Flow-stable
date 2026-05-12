import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import engramClient from '../../services/engramClient'

const getTimeline = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid observation ID' })
        }
        const timeline = await engramClient.getTimeline(id)
        return res.json(timeline)
    } catch (error) {
        next(error)
    }
}

export default {
    getTimeline
}
