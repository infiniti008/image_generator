import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';
const executablePath = process.env['executablePath_' + env];
const mediaFolderPath = process.env['mediaFolderPath_' + env];

import puppeteer from 'puppeteer';

export function waiting(msg) {
  console.log('WAITING: ' + msg);
}

export function complete(msg) {
  console.log('COMPLET: ' + msg);
}

export async function takeScreenshot(page, delay = 3000) {
  waiting('TAKE A SCREENSHOT');
  const screenshotPath = env === 'prod' 
    ? mediaFolderPath + '/images/' + new Date().toLocaleDateString('ru-RU') + '-screenshot-' + new Date().toLocaleTimeString('ru-RU').replace(', ','-') + '.png' 
    : 'img.png';
  await page.waitForTimeout(delay);
  await page.screenshot({
    path: screenshotPath
  });
  console.log('SCREENSHOT PATH: ' + screenshotPath);
  complete('TAKE A SCREENSHOT');
}

export async function launch() {
  waiting('LAUNCH BROWSER');
  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      // slowMo: 50,
      args: ['--no-sandbox', '--lang="en-US"']
    });

    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en'
    });

    complete('LAUNCH BROWSER');
    return { _page: page, _browser: browser };
  } catch(err) {
    console.log(err?.message);
    console.log('ERROR: LAUNCH BROWSER');
    return {};
  }
}

export async function openUploadPage(page, content) {

  waiting('SET COOKIES');
  try {
    const savedCookies = content.renderSettings['cookies_tiktok_' + content.country];
    await page.setCookie(...savedCookies);
    console.log('SUCCESS: SET COOKIES');
  } catch(err) {
    console.log(err.message);
    console.log('ERROR: SET COOKIES');
  }
  complete('SET COOKIES');

  
  try {
    waiting('OPEN PAGE');
    await page.setViewport({
      width: 1360,
      height: 800
    });

    await page.goto('https://www.tiktok.com/upload?lang=en', { timeout: 15000 });
    return true;
  } catch(err) {
    console.log(err.message);
    console.log('ERROR: OPEN PAGE');
  } finally {
    complete('OPEN PAGE');
  }
}

export async function upload(page, content) {
  waiting('CLICK SELECT FILE BUTTON');
  const selectorHeader = '#webapp-header-mask';
  await page.waitForSelector(selectorHeader);
  await page.waitForTimeout(3000);

  await page.waitForSelector('iframe');

  const elementHandle = await page.$(
    'iframe[src="https://www.tiktok.com/creator#/upload?lang=en"]',
  );
  const frame = await elementHandle.contentFrame();
  await page.waitForTimeout(1000);
  const [buttonSelectFromComputer] = await frame.$x('//*[contains(text(), "Select files")]');

  await page.waitForTimeout(1000);
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    await buttonSelectFromComputer.click()
  ]);
  
  await fileChooser.accept([mediaFolderPath + content.videoPath]);
  complete('CLICK SELECT FILE BUTTON');
}




  // await page.goto('https://www.tiktok.com/login/phone-or-email/phone-password?lang=en');
  // await page.goto('https://www.tiktok.com?lang=en');

  // waiting('CLICK LOG IN BUTTON');
  // await page.waitForSelector('#header-login-button');
  // await page.click('#header-login-button');
  // complete('CLICK LOG IN BUTTON');


  // waiting('CLICK LOGIN BY PHONE');
  // await page.waitForXPath('//*[contains(text(), "Use phone / email / username")]', { timeout: 1000 });
  // const [buttonUsePhone] = await page.$x('//*[contains(text(), "Allow all cookies")]');
  // if (buttonUsePhone) {
  //   await buttonUsePhone.click();
  //   await buttonUsePhone.click();
  //   // await page.waitForFunction((selectorCoockieDialog) => !document.querySelector(selectorCoockieDialog), {}, selectorCoockieDialog);
  // }
  // complete('CLICK LOGIN BY PHONE');

  // waiting('FILL LOG IN FORM');
  // const selectorCountryCodeButton = 'div[aria-controls="phone-country-code-selector-wrapper"]';
  // await page.waitForSelector(selectorCountryCodeButton);
  // await page.click(selectorCountryCodeButton);
  // await page.keyboard.press('3');
  // await page.keyboard.press('7');
  // await page.keyboard.press('5');
  // await page.keyboard.press('Enter');
  // await page.type('input[name="mobile"]', '447135093');
  // await page.type('input[type="password"]', 'Teht1nP0bedy-!');

  // const selectorVerifyBarClose = '#verify-bar-close';
  // const selectorButtonLogIn = 'button[type="submit"]';
  
  // for(let i = 0; i < 10; i++) {
  //   await page.waitForSelector(selectorButtonLogIn);
  //   await page.hover(selectorButtonLogIn);
  //   await page.click(selectorButtonLogIn);
  //   await page.waitForSelector(selectorVerifyBarClose);

  //   await page.waitForSelector('.secsdk-captcha-drag-icon');
  //   await page.waitForTimeout(500);
  //   await page.click('.secsdk-captcha-drag-icon');
  //   await page.waitForTimeout(700);

  //   await page.mouse.move(530, 530);
  //   await page.mouse.down();
  //   await page.mouse.move(700, 530);
  //   await page.waitForTimeout(300);
  //   await page.mouse.move(600, 530);
  //   await page.waitForTimeout(300);
  //   await page.mouse.move(520, 530);
  //   await page.waitForTimeout(300);
  //   await page.mouse.move(650, 530);
  //   await page.waitForTimeout(300);
  //   await page.mouse.up();

    // await page.waitForTimeout(20000);

  //   await page.click(selectorVerifyBarClose);
  // }
  



  // await page.click(selectorButtonLogIn);
  // await page.waitForSelector(selectorVerifyBarClose);
  // await page.click(selectorVerifyBarClose);

  // await page.click(selectorButtonLogIn);
  // await page.waitForSelector(selectorVerifyBarClose);
  // await page.click(selectorVerifyBarClose);

  // await page.click(selectorButtonLogIn);
  // await page.waitForSelector(selectorVerifyBarClose);
  // await page.click(selectorVerifyBarClose);

  


  // waiting('SAVE COOKIES');
  // const cookies = await page.cookies();   
  // fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
  // complete('SAVE COOKIES');