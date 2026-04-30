import { watch } from 'node:fs'
import { resolve } from 'node:path'
import { build } from './bunstart.build'

async function main(): Promise<void> {
    console.info('Initial build...')
    await build()

    const watchPath = resolve(process.cwd(), 'src')
    console.info(`Watching ${watchPath}...`)

    let timeout: ReturnType<typeof setTimeout> | null = null

    const watcher = watch(watchPath, { recursive: true }, async (eventType, filename) => {
        if (eventType !== 'change') return
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(async () => {
            const trigger = filename ? ` (${filename})` : ''
            console.info(`\nRebuilding${trigger}...`)
            try {
                await build()
            } catch (e) {
                console.error('Build failed:', e)
            }
        }, 100)
    })

    process.on('SIGINT', () => {
        watcher.close()
        if (timeout) clearTimeout(timeout)
        process.exit(0)
    })
}

main().catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
})
