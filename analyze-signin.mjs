// Quick signin page analysis
import { chromium } from 'playwright'

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

    // Collect ALL console output
    const logs = []
    page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text().substring(0, 200)}`))
    page.on('pageerror', (err) => logs.push(`[PAGE_ERROR] ${err.message}`))

    await page.goto('http://localhost:8080/signin', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    await page.screenshot({ path: '/tmp/signin-full.png' })

    // Dump ALL input elements
    const inputs = await page.$$('input')
    console.log(`\nTotal <input> elements: ${inputs.length}`)
    for (const input of inputs) {
        const attrs = await input.evaluate((el) => ({
            name: el.name,
            type: el.type,
            id: el.id,
            placeholder: el.placeholder,
            className: el.className.substring(0, 60),
            autocomplete: el.autocomplete
        }))
        console.log(JSON.stringify(attrs))
    }

    // Dump ALL buttons
    const buttons = await page.$$('button')
    console.log(`\nTotal <button> elements: ${buttons.length}`)
    for (const btn of buttons) {
        const attrs = await btn.evaluate((el) => ({
            text: el.textContent.trim().substring(0, 30),
            type: el.type,
            id: el.id,
            className: el.className.substring(0, 60)
        }))
        console.log(JSON.stringify(attrs))
    }

    // Try filling with generic approach
    // Try all visible text inputs
    const textInputs = page.locator('input[type="text"], input[type="email"], input:not([type])')
    const count = await textInputs.count()
    console.log(`\nVisible text/email inputs: ${count}`)

    for (let i = 0; i < count; i++) {
        const inp = textInputs.nth(i)
        const ph = await inp.getAttribute('placeholder')
        const nm = await inp.getAttribute('name')
        console.log(`  Input ${i}: name="${nm}" placeholder="${ph}"`)
    }

    // Check if we're actually on signin page
    const pageText = await page.textContent('body')
    console.log(`\nPage contains "sign in": ${pageText.toLowerCase().includes('sign in')}`)
    console.log(`Page contains "login": ${pageText.toLowerCase().includes('login')}`)
    console.log(`Page contains "email": ${pageText.toLowerCase().includes('email')}`)

    // URL
    console.log(`\nCurrent URL: ${page.url()}`)

    // Print console logs
    console.log(`\n--- Console logs (${logs.length}) ---`)
    logs.forEach((l) => console.log(l))

    await browser.close()
}

main().catch((e) => console.error(e.message))
