import express from 'express'
import memoriesRouter from './memories'
import sessionsRouter from './sessions'
import searchRouter from './search'
import statsRouter from './stats'
import conflictsRouter from './conflicts'
import contextRouter from './context'
import timelineRouter from './timeline'
import syncRouter from './sync'

const router = express.Router()

router.use('/memories', memoriesRouter)
router.use('/sessions', sessionsRouter)
router.use('/search', searchRouter)
router.use('/stats', statsRouter)
router.use('/conflicts', conflictsRouter)
router.use('/context', contextRouter)
router.use('/timeline', timelineRouter)
router.use('/sync', syncRouter)

export default router
