import express from 'express'
import timelineController from '../../controllers/timeline'

const router = express.Router()

router.get('/:id', timelineController.getTimeline)

export default router
