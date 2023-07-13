import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';
const executablePath = process.env['executablePath_' + env];
const mediaFolderPath = process.env['mediaFolderPath_' + env];

import fs from 'fs';
import puppeteer from 'puppeteer';

export const variablesByCountry = {
  pl: {
    cookiesPath: './cookiesPL.json',
    cityName: 'Warszawa'
  },
  by: {
    cookiesPath: './cookiesBY.json',
    cityName: 'Minsk'
  }
};

export async function removeCookies(content) {
  // try {
  //   const { cookiesPath } = variablesByCountry[content.country];

  //   fs.unlinkSync(cookiesPath);
  // } catch(err) {
  //   console.log(err?.message);
  // }
}

export async function takeScreenshot(page, delay = 3000) {
  console.log('WAITING: TAKE A SCREENSHOT');
  const screenshotPath = env === 'prod' 
    ? mediaFolderPath + '/images/' + new Date().toLocaleString('ru-RU').replace(', ', '-') + '-screenshot.png' 
    : 'img.png';
  await page.waitForTimeout(delay);
  await page.screenshot({
    path: screenshotPath
  });
  console.log('SCREENSHOT PATH: ' + screenshotPath);
  console.log('COMPLET: TAKE A SCREENSHOT');
}

export async function launch() {
  console.log('WAITING: LAUNCH BROWSER');
  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--lang=en-US']
    });

    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en'
    });

    const m = puppeteer.devices['iPhone 12 Pro'];
    await page.emulate(m);

    console.log('COMPLET: LAUNCH BROWSER');
    return { _page: page, _browser: browser };
  } catch(err) {
    console.log(err?.message);
    console.log('ERROR: LAUNCH BROWSER');
    return {};
  }
  
}

export async function logIn(page, content) {
  // const { cookiesPath } = variablesByCountry[content.country];

  // console.log('WAITING: SET COOKIES');
  // try {
  //   let savedCookiesPL = fs.readFileSync(cookiesPath).toString();
  //   savedCookiesPL = JSON.parse(savedCookiesPL);
  //   await page.setCookie(...savedCookiesPL);
  //   console.log('SUCCESS: SET COOKIES');
  // } catch(err) {
  //   console.log(err.message);
  //   console.log('ERROR: SET COOKIES');
  // }
  // console.log('COMPLET: SET COOKIES');


  console.log('WAITING: OPEN PAGE');
  await page.goto('https://www.instagram.com/');
  await page.setViewport({width: 390, height: 800});
  console.log('COMPLET: OPEN PAGE');

  console.log('WAITING: CHECK LOGIN');
  const selectorAddContent = 'a[href="#"]';
  let isLoggedInByCookies = false;
  let isLoggedInByLogin = false;

  // try {
  //   await page.waitForSelector(selectorAddContent, { timeout: 6000 });
  //   isLoggedInByCookies = true;
  // } catch(err) {
  //   console.log(err.message);
  //   await takeScreenshot(page, 1000);
  // }
  // console.log('COMPLET: CHECK LOGIN - ', isLoggedInByCookies);


  if (!isLoggedInByCookies) {
    console.log('WAITING: CLICK ACEPT COOCKIE BUTTON');
    const selectorCoockieDialog = 'div[role="dialog"]';
    try {
      await page.waitForXPath('//*[contains(text(), "Allow all cookies")]', { timeout: 6000 });
      const [buttonAcceptCookies] = await page.$x('//*[contains(text(), "Allow all cookies")]');
      if (buttonAcceptCookies) {
        await buttonAcceptCookies.click();
        await page.waitForFunction((selectorCoockieDialog) => !document.querySelector(selectorCoockieDialog), {}, selectorCoockieDialog);
      }
    } catch (err) {
      console.log(err?.message);
    }
    console.log('COMPLET: CLICK ACEPT COOCKIE BUTTON');


    console.log('WAITING: OPEN LOG IN FORM');
    const selectorUserNameInput = 'input[name="username"]';
    await page.waitForXPath('//*[contains(text(), "Log in")]', { timeout: 6000 });
    const [buttonLogIn] = await page.$x('//*[contains(text(), "Log in")]');
    if (buttonLogIn) {
      await buttonLogIn.click();
      await page.waitForSelector(selectorUserNameInput);
    }
    console.log('COMPLET: OPEN LOG IN FORM');


    console.log('WAITING: FILL LOG IN FORM');
    const login = process.env['login_' + content.country];
    const password = process.env['password_' + content.country];
    await page.type(selectorUserNameInput, login);
    const selectorPasswordInput = 'input[name="password"]';
    await page.type(selectorPasswordInput, password);
    const selectorButtonLogIn = 'button[type="submit"]';
    await page.click(selectorButtonLogIn);
    console.log('COMPLET: FILL LOG IN FORM');

    
    console.log('WAITING: CLICK SAVE INFO TO LOGIN');
    try {
      await page.waitForXPath('//*[contains(text(), "Save Info")]', { timeout: 6000 });
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
    } catch (err) {
      console.log('ERROR: CLICK SAVE INFO TO LOGIN');
      console.log(err.message);
      await takeScreenshot(page, 1000);
    }
    console.log('COMPLET: CLICK SAVE INFO TO LOGIN');


    console.log('WAITING: CHECK LOGIN AFTER LOGIN');
    try {
      await page.waitForSelector(selectorAddContent, { timeout: 6000 });
      isLoggedInByLogin = true;
    } catch(err) {
      console.log(err);
      await takeScreenshot(page, 1000);
    }
    console.log('COMPLET: CHECK LOGIN AFTER LOGIN - ', isLoggedInByLogin);
  }


  // if (isLoggedInByLogin) {
  //   console.log('WAITING: SAVE COOKIES');
  //   const cookies = await page.cookies();   
  //   fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
  //   console.log('COMPLET: SAVE COOKIES');
  // } else if (!isLoggedInByCookies) {
  //   removeCookies(content);
  // }
}