// Robust signin page analysis with longer wait
import { chromium } from 'playwright'

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

    await page.goto('http://localhost:8080/signin', { waitUntil: 'networkidle', timeout: 30000 })

    // Wait longer for React to render
    await page.waitForTimeout(5000)

    // Get full HTML
    const html = await page.content()
    console.log('=== FULL HTML (first 5000 chars) ===')
    console.log(html.substring(0, 5000))

    console.log('\n=== REMAINING HTML ===')
    console.log(html.substring(5000, Math.min(html.length, 10000)))

    console.log('\n=== LAST PART ===')
    console.log(html.substring(Math.max(0, html.length - 2000)))

    // Check page title
    console.log(`\nPage title: "${await page.title()}"`)
    console.log(`URL: ${page.url()}`)

    // Take screenshot
    await page.screenshot({ path: '/tmp/signin-debug.png', fullPage: true })

    await browser.close()
}

main().catch((e) => console.error(e.message))
