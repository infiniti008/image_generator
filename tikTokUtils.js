import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';
const executablePath = process.env['executablePath_' + env];
const mediaFolderPath = process.env['mediaFolderPath_' + env];

import puppeteer from 'puppeteer';


export const variablesByCountry = {
  pl: {
    cookiesPath: './cookiesPL.json',
    cityName: 'Warsaw, Poland',
    url: 'https://www.tiktok.com/upload?lang=en',
    iframeSelector: 'iframe[src="https://www.tiktok.com/creator#/upload?lang=en"]',
    mainPageSelector: '#webapp-header-mask',
  },
  by: {
    cookiesPath: './cookiesBY.json',
    cityName: 'Minsk, Belarus',
    url: 'https://www.tiktok.com/creator-center/upload?lang=en',
    iframeSelector: 'iframe[src="https://www.tiktok.com/creator#/upload?scene=creator_center"]',
    mainPageSelector: 'div[data-tt="Upload_index_UploadContainer"]',
  }
};

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
      slowMo: 10,
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

    const url = variablesByCountry[content.country].url;
    await page.goto(url, { timeout: 15000 });
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
  const selectorHeader = variablesByCountry[content.country].mainPageSelector;
  await page.waitForSelector(selectorHeader);
  await page.waitForTimeout(3000);

  await page.waitForSelector('iframe');

  const elementHandle = await page.$(
    variablesByCountry[content.country].iframeSelector,
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