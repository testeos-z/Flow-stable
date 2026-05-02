import { chromium } from 'playwright'

async function testLogin() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-web-security'] // Allow CORS
    })
    const context = await browser.newContext({
        javaScriptEnabled: true
    })
    const page = await context.newPage()

    // Listen for console errors
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            console.log('Console error:', msg.text())
        }
    })

    page.on('pageerror', (error) => {
        console.log('Page error:', error.message)
    })

    console.log('Navigating to http://localhost:8080/signin...')

    await page.goto('http://localhost:8080/signin', { waitUntil: 'networkidle', timeout: 15000 })

    // Wait for React to render
    await page.waitForTimeout(3000)

    console.log('Current URL:', page.url())

    // Take screenshot
    await page.screenshot({ path: '/tmp/login-page.png' })

    // Find inputs
    const emailInput = page.locator('input[name="username"]')
    const passwordInput = page.locator('input[name="password"]')

    console.log('Email input count:', await emailInput.count())
    console.log('Password input count:', await passwordInput.count())

    if ((await emailInput.count()) > 0) {
        console.log('Filling credentials...')
        await emailInput.fill('bryandavidaaa@gmail.com')
        await passwordInput.fill('Bryansanabria21=')

        await page.screenshot({ path: '/tmp/login-filled.png' })

        const loginButton = page.getByRole('button', { name: 'Login' })
        console.log('Login button count:', await loginButton.count())

        await loginButton.click()

        console.log('Clicked login, waiting for response...')
        await page.waitForTimeout(5000)

        console.log('Final URL:', page.url())

        await page.screenshot({ path: '/tmp/login-after.png' })

        if (page.url().includes('signin')) {
            console.log('❌ LOGIN FAILED - Still on signin page')
        } else {
            console.log('✅ LOGIN SUCCESSFUL - Redirected to:', page.url())
        }
    } else {
        console.log('Login form not found!')
    }

    await browser.close()
}

testLogin().catch((e) => console.log('Error:', e.message))
