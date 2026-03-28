const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log(`[CONSOLE] [${msg.type()}] ${msg.text()}`);
        });
        
        page.on('pageerror', err => {
            console.error('[PAGEERROR]', err.message);
        });

        await page.goto('file:///d:/car/index.html', { waitUntil: 'load' });
        
        // Wait a bit
        await new Promise(r => setTimeout(r, 1000));
        
        // Click begin journey
        const btn = await page.$('.start-btn');
        if (btn) {
            console.log('Clicking begin journey...');
            await btn.click();
            await new Promise(r => setTimeout(r, 1500));
        } else {
            console.log('Button not found!');
        }
        
        await browser.close();
    } catch(e) {
        console.error(e);
    }
})();
