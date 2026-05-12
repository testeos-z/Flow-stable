import express from 'express'
import syncController from '../../controllers/sync'

const router = express.Router()

router.post('/cloud', syncController.syncToCloud)
router.get('/cloud/status', syncController.getCloudStatus)

export default router
