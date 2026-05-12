import express from 'express'
import searchController from '../../controllers/search'

const router = express.Router()

router.get('/', searchController.searchMemories)

export default router
