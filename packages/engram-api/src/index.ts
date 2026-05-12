import { createApp } from './app'
import logger from './utils/logger'

const PORT = parseInt(process.env.PORT || '7438')
const ENGRAM_URL = process.env.ENGRAM_URL || 'http://localhost:7437'

async function startServer() {
    try {
        const app = createApp()

        const server = app.listen(PORT, () => {
            logger.info(`🧠 Engram API service listening on port ${PORT}`)
            logger.info(`🔗 Engram backend configured at: ${ENGRAM_URL}`)
        })

        // Graceful shutdown
        const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT']
        signals.forEach((signal) => {
            process.on(signal, () => {
                logger.info(`Received ${signal}, shutting down gracefully...`)
                server.close(() => {
                    logger.info('Server closed')
                    process.exit(0)
                })
            })
        })
    } catch (error) {
        logger.error('Failed to start server:', error)
        process.exit(1)
    }
}

startServer()
