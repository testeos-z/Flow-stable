// Robust signin with longer waits and form detection
import { chromium } from 'playwright'

const CREDENTIALS = {
    email: 'bryandavidaaa@gmail.com',
    password: 'Bryansanabria21='
}

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

    const consoleErrors = []
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    console.log('1. Navigating to signin...')
    await page.goto('http://localhost:8080/signin', { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for React to render the form - use MUI specific selectors
    console.log('2. Waiting for signin form to render...')

    try {
        // Wait for the progress bar to disappear (meaning React is done loading)
        await page.waitForFunction(
            () => {
                const progressBar = document.querySelector('.MuiLinearProgress-root')
                return !progressBar || progressBar.offsetParent === null
            },
            { timeout: 20000 }
        )
        console.log('   Progress bar gone - React loaded')
    } catch (e) {
        console.log('   Progress bar still visible or timeout')
    }

    await page.waitForTimeout(3000)
    await page.screenshot({ path: '/tmp/signin-form.png' })

    // Try multiple selector strategies for email
    console.log('\n3. Looking for form elements...')

    // Strategy 1: name attribute
    let emailInp = page.locator('input[name="username"]')
    let passInp = page.locator('input[name="password"]')

    // Strategy 2: placeholder
    if ((await emailInp.count()) === 0) {
        emailInp = page.locator('input[placeholder*="email"], input[placeholder*="user"], input[placeholder*="company"]')
    }

    // Strategy 3: type
    if ((await emailInp.count()) === 0) {
        emailInp = page.locator('input[type="email"], input[type="text"]').first()
    }

    // Password strategies
    if ((await passInp.count()) === 0) {
        passInp = page.locator('input[type="password"]')
    }

    console.log(`   Email input: ${await emailInp.count()}`)
    console.log(`   Password input: ${await passInp.count()}`)

    if ((await emailInp.count()) > 0 && (await passInp.count()) > 0) {
        console.log('4. Filling credentials...')
        await emailInp.first().fill(CREDENTIALS.email)
        await passInp.first().fill(CREDENTIALS.password)
        await page.screenshot({ path: '/tmp/signin-filled.png' })

        // Try login buttons
        const loginBtn = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Iniciar")')
        console.log(`   Login button: ${await loginBtn.count()}`)

        if ((await loginBtn.count()) > 0) {
            await loginBtn.first().click()
            console.log('5. Clicked login, waiting for redirect...')

            // Wait for redirect away from signin
            try {
                await page.waitForURL((url) => !url.includes('signin'), { timeout: 20000 })
                console.log(`   ✅ Redirected to: ${page.url()}`)
            } catch {
                console.log(`   ⚠️ No redirect, still at: ${page.url()}`)
            }

            await page.waitForTimeout(3000)
            await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
            await page.screenshot({ path: '/tmp/post-login-success.png' })
            console.log(`   Final URL: ${page.url()}`)

            // NOW NAVIGATE TO CHATFLOWS
            const FAILING_ID = 'fe5c4e0f-a219-45f2-9b23-0c780cf01307'
            const WORKING_ID = '409dc550-19a7-4d67-9cd2-5b8b2af0973e'

            // Check failing flow
            console.log('\n6. Navigating to FAILING chatflow...')
            await page.goto(`http://localhost:8080/canvas/${FAILING_ID}`, { waitUntil: 'networkidle', timeout: 30000 })
            await page.waitForTimeout(5000)
            await page.screenshot({ path: `/tmp/failing-flow-${FAILING_ID}.png` })

            const failingNodes = page.locator('.react-flow__node')
            console.log(`   Nodes rendered: ${await failingNodes.count()}`)
            const failingEdges = page.locator('.react-flow__edge')
            console.log(`   Edges rendered: ${await failingEdges.count()}`)

            const failingBody = await page.textContent('body')
            const errorKeywords = ['Cannot read properties', 'undefined', 'is not a function']
            for (const kw of errorKeywords) {
                if (failingBody.includes(kw)) {
                    const idx = failingBody.indexOf(kw)
                    console.log(`   ⚠️ ERROR in page: "${failingBody.substring(Math.max(0, idx - 20), idx + 150)}"`)
                }
            }

            // Check working flow
            console.log('\n7. Navigating to WORKING chatflow...')
            await page.goto(`http://localhost:8080/canvas/${WORKING_ID}`, { waitUntil: 'networkidle', timeout: 30000 })
            await page.waitForTimeout(5000)
            await page.screenshot({ path: `/tmp/working-flow-${WORKING_ID}.png` })

            const workingNodes = page.locator('.react-flow__node')
            console.log(`   Nodes rendered: ${await workingNodes.count()}`)
            const workingEdges = page.locator('.react-flow__edge')
            console.log(`   Edges rendered: ${await workingEdges.count()}`)

            const workingBody = await page.textContent('body')
            for (const kw of errorKeywords) {
                if (workingBody.includes(kw)) {
                    const idx = workingBody.indexOf(kw)
                    console.log(`   ⚠️ ERROR in page: "${workingBody.substring(Math.max(0, idx - 20), idx + 150)}"`)
                }
            }
        } else {
            console.log('   No login button found')
            // Try pressing Enter
            await page.keyboard.press('Enter')
            await page.waitForTimeout(5000)
            console.log(`   After Enter: ${page.url()}`)
        }
    } else {
        console.log('4. Form not fully rendered - dumping page state')
        const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML?.substring(0, 2000))
        console.log(`   Root innerHTML: ${rootHTML || 'empty'}`)
    }

    // Console error summary
    console.log(`\n\n=== CONSOLE ERRORS (${consoleErrors.length}) ===`)
    ;[...new Set(consoleErrors)].forEach((e, i) => {
        console.log(`${i + 1}. ${e.substring(0, 300)}`)
    })

    await browser.close()
}

main().catch((e) => console.error('Fatal:', e.message))
