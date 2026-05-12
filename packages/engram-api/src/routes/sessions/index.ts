import express from 'express'
import sessionsController from '../../controllers/sessions'

const router = express.Router()

router.post('/start', sessionsController.startSession)
router.post('/end', sessionsController.endSession)
router.post('/summary', sessionsController.saveSummary)
router.get('/:id', sessionsController.getSession)

export default router
