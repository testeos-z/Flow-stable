// Full E2E diagnostic for chatflow rendering
import { chromium } from 'playwright'

const CREDENTIALS = {
    email: 'bryandavidaaa@gmail.com',
    password: 'Bryansanabria21='
}

const FLOWS = {
    failing: {
        id: 'fe5c4e0f-a219-45f2-9b23-0c780cf01307',
        label: '🔴 FAILING - Education Agent - Madeira',
        url: '/canvas/fe5c4e0f-a219-45f2-9b23-0c780cf01307'
    },
    working: {
        id: '409dc550-19a7-4d67-9cd2-5b8b2af0973e',
        label: '🟢 WORKING - prueba economico',
        url: '/canvas/409dc550-19a7-4d67-9cd2-5b8b2af0973e'
    }
}

async function diagnoseFlow(page, flow, errors) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`DIAGNOSING: ${flow.label}`)
    console.log(`${'='.repeat(60)}`)

    // Navigate
    console.log(`\n1. Navigating to ${flow.url}...`)
    await page.goto(`http://localhost:8080${flow.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
    })
    await page.waitForTimeout(3000)

    console.log(`   Final URL: ${page.url()}`)

    // Screenshot
    const screenshotPath = `/tmp/flow-${flow.id}-canvas.png`
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`2. Screenshot saved: ${screenshotPath}`)

    // Look for React Flow canvas
    const canvasContainer = page.locator('.react-flow__renderer, .react-flow, .flow-canvas, [data-testid="rf__wrapper"]')
    console.log(`3. React Flow container count: ${await canvasContainer.count()}`)

    if ((await canvasContainer.count()) > 0) {
        const isVisible = await canvasContainer.first().isVisible()
        console.log(`   Container visible: ${isVisible}`)
    }

    // Check for nodes in DOM
    const nodes = page.locator('.react-flow__node')
    console.log(`4. React Flow nodes count: ${await nodes.count()}`)

    if ((await nodes.count()) > 0) {
        for (let i = 0; i < (await nodes.count()); i++) {
            const node = nodes.nth(i)
            const text = await node.textContent()
            const id = await node.getAttribute('data-id')
            console.log(`   Node ${i}: data-id="${id}" text="${text?.substring(0, 80) || ''}"`)
        }
    } else {
        console.log('   ⚠️ NO NODES RENDERED in DOM')
    }

    // Check for edges
    const edges = page.locator('.react-flow__edge')
    console.log(`5. React Flow edges count: ${await edges.count()}`)

    // Look for error messages
    const errorTexts = ['Cannot read properties', 'undefined', 'is not a function', 'Failed to', 'Error']
    const bodyText = await page.textContent('body')
    for (const err of errorTexts) {
        if (bodyText.includes(err)) {
            const context = bodyText.substring(Math.max(0, bodyText.indexOf(err) - 50), bodyText.indexOf(err) + 100)
            console.log(`6. ⚠️ ERROR FOUND IN PAGE: "...${context}..."`)
        }
    }

    // Check for canvas placeholder / empty state
    const emptyState = page.locator('text=Drag and drop, text=No nodes, text=Empty canvas, text=Add node')
    console.log(`7. Empty state indicators: ${await emptyState.count()}`)

    // Viewport info
    const viewportEl = page.locator('.react-flow__viewport')
    if ((await viewportEl.count()) > 0) {
        const transform = await viewportEl.getAttribute('style')
        console.log(`8. Viewport transform: ${transform}`)
    } else {
        console.log('8. No viewport element found')
    }

    return errors
}

async function main() {
    const consoleErrors = []
    const pageErrors = []

    console.log('Launching Chromium...')
    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-web-security', '--no-sandbox']
    })

    const context = await browser.newContext({
        javaScriptEnabled: true,
        viewport: { width: 1920, height: 1080 }
    })

    const page = await context.newPage()

    // Capture ALL console messages
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text())
        }
        if (msg.type() === 'warning') {
            console.log(`[CONSOLE WARN] ${msg.text().substring(0, 200)}`)
        }
    })

    page.on('pageerror', (error) => {
        pageErrors.push(error.message)
        console.log(`[PAGE ERROR] ${error.message}`)
    })

    // ===================================
    // STEP 1: SIGN IN
    // ===================================
    console.log('\n🔐 SIGNING IN...')
    console.log('='.repeat(60))

    await page.goto('http://localhost:8080/signin', {
        waitUntil: 'networkidle',
        timeout: 30000
    })
    await page.waitForTimeout(3000)

    console.log(`Login page URL: ${page.url()}`)
    await page.screenshot({ path: '/tmp/signin-page.png' })

    // Find form elements
    const emailInput = page.locator('input[name="username"], input[type="email"], #email')
    const passwordInput = page.locator('input[name="password"], input[type="password"], #password')

    console.log(`Email input found: ${await emailInput.count()}`)
    console.log(`Password input found: ${await passwordInput.count()}`)

    if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
        await emailInput.first().fill(CREDENTIALS.email)
        await passwordInput.first().fill(CREDENTIALS.password)

        const loginBtn = page.getByRole('button', { name: /login|sign in|iniciar/i })
        console.log(`Login button found: ${await loginBtn.count()}`)

        if ((await loginBtn.count()) > 0) {
            await loginBtn.first().click()

            // Wait for redirect
            await page.waitForTimeout(5000)
            await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})

            console.log(`After login URL: ${page.url()}`)
            await page.screenshot({ path: '/tmp/post-login.png' })

            if (!page.url().includes('signin')) {
                console.log('✅ Login successful')

                // ===================================
                // STEP 2: DIAGNOSE FAILING FLOW
                // ===================================
                await diagnoseFlow(page, FLOWS.failing, consoleErrors)

                // ===================================
                // STEP 3: DIAGNOSE WORKING FLOW
                // ===================================
                await diagnoseFlow(page, FLOWS.working, consoleErrors)
            } else {
                console.log('❌ Login failed - still on signin page')
                // Try alternate approach: maybe already logged in via cookie
                await diagnoseFlow(page, FLOWS.failing, consoleErrors)
                await diagnoseFlow(page, FLOWS.working, consoleErrors)
            }
        } else {
            console.log('Login button not found')
        }
    } else {
        console.log('Login form not found')
    }

    // ===================================
    // FINAL REPORT
    // ===================================
    console.log(`\n${'='.repeat(60)}`)
    console.log('📊 FINAL DIAGNOSTIC REPORT')
    console.log(`${'='.repeat(60)}`)

    console.log(`\nConsole errors (${consoleErrors.length}):`)
    if (consoleErrors.length > 0) {
        // Deduplicate
        const unique = [...new Set(consoleErrors)]
        unique.forEach((e, i) => console.log(`  ${i + 1}. ${e.substring(0, 300)}`))
    } else {
        console.log('  ✅ None')
    }

    console.log(`\nPage errors (${pageErrors.length}):`)
    if (pageErrors.length > 0) {
        const unique = [...new Set(pageErrors)]
        unique.forEach((e, i) => console.log(`  ${i + 1}. ${e.substring(0, 300)}`))
    } else {
        console.log('  ✅ None')
    }

    // Check if React Flow error pattern exists
    const specificErrors = consoleErrors.filter(
        (e) =>
            e.includes('Cannot read properties') ||
            e.includes('undefined') ||
            e.includes('viewport') ||
            e.includes('length') ||
            e.includes('nodes')
    )

    if (specificErrors.length > 0) {
        console.log('\n🔍 RELEVANT ERRORS (viewport/nodes):')
        specificErrors.forEach((e) => console.log(`  - ${e.substring(0, 300)}`))
    }

    await browser.close()
}

main().catch((e) => {
    console.error('Fatal:', e.message)
    process.exit(1)
})
