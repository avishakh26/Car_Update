const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle0' });
  
  await page.waitForSelector('.start-btn');
  await page.click('.start-btn');
  await new Promise(r => setTimeout(r, 1000));
  
  // enable FPP
  await page.evaluate(() => { toggleCameraMode(); });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'fpp.png' });
  
  await browser.close();
  console.log("DONE");
})();
