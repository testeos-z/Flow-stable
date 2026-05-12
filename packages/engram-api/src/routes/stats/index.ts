import express from 'express'
import statsController from '../../controllers/stats'

const router = express.Router()

router.get('/', statsController.getStats)

export default router
