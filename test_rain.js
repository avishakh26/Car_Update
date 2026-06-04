const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) {
      console.log('404:', response.url());
    }
  });
  
  await page.goto('http://127.0.0.1:3000');
  
  await page.waitForSelector('.start-btn');
  await page.click('.start-btn');
  await new Promise(r => setTimeout(r, 1000));
  
  // enable rain
  await page.evaluate(() => { setWeather('rain'); });
  await new Promise(r => setTimeout(r, 500));
  
  const info = await page.evaluate(() => {
    return {
      rainVisible: typeof Weather !== 'undefined' ? (scene.children.find(c => c.type === 'Points' && c.material.color.getHex() === 0xcceeff)?.visible) : null,
      cameraPos: camera.position,
      carPos: scene.children.find(c => c.type === 'Group')?.position // approximate car pos
    };
  });
  console.log("INFO:", info);
  
  await page.screenshot({ path: 'rain.png' });
  
  await browser.close();
  console.log("DONE");
})();
