import express from 'express'
import contextController from '../../controllers/context'

const router = express.Router()

router.get('/', contextController.getContext)

export default router
