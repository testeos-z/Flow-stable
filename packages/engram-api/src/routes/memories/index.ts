import express from 'express'
import memoriesController from '../../controllers/memories'

const router = express.Router()

// CREATE
router.post('/', memoriesController.createMemory)

// READ
router.get('/', memoriesController.getAllMemories)
router.get('/:id', memoriesController.getMemoryById)

// UPDATE
router.put('/:id', memoriesController.updateMemory)

// DELETE
router.delete('/:id', memoriesController.deleteMemory)

export default router
