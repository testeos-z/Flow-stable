import express from 'express'
import conflictsController from '../../controllers/conflicts'

const router = express.Router()

router.get('/', conflictsController.listConflicts)
router.post('/scan', conflictsController.scanConflicts)

export default router
