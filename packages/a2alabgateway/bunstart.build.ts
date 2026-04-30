export async function build(): Promise<void> {
    console.info('Building @gbai-agents/a2alabgateway...')
    await Bun.build({
        entrypoints: ['src/server.ts'],
        outdir: 'dist',
        target: 'node',
        format: 'esm',
        minify: false,
        sourcemap: false
    })
    console.info('Build completed')
}

const isMain = process.argv[1]?.endsWith('bunstart.build.ts') || process.argv[1]?.endsWith('bunstart.build.js')
if (isMain) {
    build().catch((e) => {
        console.error('Build failed', e)
        process.exit(1)
    })
}
