import 'dotenv/config'
import { createApp } from './app'

const PORT = Number(process.env.PORT) || 4100

const app = createApp()

app.listen(PORT, () => {
    console.info(`\n🚀 a2alabgateway is running on http://localhost:${PORT}`)
    console.info(`   Healthcheck: http://localhost:${PORT}/health\n`)
})
