import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

import puppeteer from 'puppeteer';
import fs from 'fs';

const variablesByCountry = {
  pl: {
    cookiesPath: './cookiesPL.json',
  },
  by: {
    cookiesPath: './cookiesBY.json'
  }
}

let browser = null;

async function runInstagram(content) {
  try {
    const { cookiesPath } = variablesByCountry[content.country];

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    const m = puppeteer.devices['iPhone 12 Pro'];
    await page.emulate(m);


    console.log('WAITING: SET COOKIES');
    try {
      let savedCookiesPL = fs.readFileSync(cookiesPath).toString();
      savedCookiesPL = JSON.parse(savedCookiesPL);
      await page.setCookie(...savedCookiesPL);
      console.log('SUCCESS: SET COOKIES');
    } catch(err) {
      console.log(err.message);
      console.log('ERROR: SET COOKIES');
    }
    console.log('COMPLET: SET COOKIES');


    console.log('WAITING: OPEN PAGE');
    await page.goto('https://www.instagram.com/');
    await page.setViewport({width: 390, height: 800});
    console.log('COMPLET: OPEN PAGE');

    console.log('WAITING: CHECK LOGIN');
    const selectorAddContent = 'a[href="#"]';
    let isLoggedInByCookies = false;
    try {
      await page.waitForSelector(selectorAddContent, { timeout: 6000 });
      isLoggedInByCookies = true;
    } catch(err) {
      console.log(err.message);
      await takeScreenshot(page, 1000);
    }
    console.log('COMPLET: CHECK LOGIN - ', isLoggedInByCookies);


    if (!isLoggedInByCookies) {
      const selectorCoockieDialog = 'div[role="dialog"]';

      console.log('WAITING: COOCKIE SELECTOR');
      try {
        await page.waitForSelector(selectorCoockieDialog, { timeout: 6000 });
      } catch(err) {
        console.log(err.message);
        await takeScreenshot(page, 1000);
      }
      console.log('COMPLET: COOCKIE SELECTOR');


      console.log('WAITING: CLICK ACEPT COOCKIE BUTTON');
      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      await page.keyboard.press('Enter');
      await page.waitForFunction((selectorCoockieDialog) => !document.querySelector(selectorCoockieDialog), {}, selectorCoockieDialog);
      console.log('COMPLET: CLICK ACEPT COOCKIE BUTTON');


      console.log('WAITING: OPEN LOG IN FORM');
      const selectorOpenLogInLink = 'div[dir="auto"]';
      const selectorUserNameInput = 'input[name="username"]';
      await page.waitForSelector(selectorOpenLogInLink);
      await page.click(selectorOpenLogInLink);
      await page.waitForSelector(selectorUserNameInput);
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
      let isLoggedInByLogin = false;
      try {
        await page.waitForSelector(selectorAddContent, { timeout: 6000 });
        isLoggedInByLogin = true;
      } catch(err) {
        console.log(err);
        await takeScreenshot(page, 1000);
      }
      console.log('COMPLET: CHECK LOGIN AFTER LOGIN - ', isLoggedInByLogin);
    }


    console.log('WAITING: SAVE COOKIES');
    const cookies = await page.cookies();   
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    console.log('COMPLET: SAVE COOKIES');


    console.log('WAITING: PRESS ADD STORY');
    await page.click(selectorAddContent);
    const selectorAddStory = 'svg[aria-label="Story"]';
    await page.waitForSelector(selectorAddStory, { timeout: 6000 });
    const targetElement = await page.$(selectorAddStory);
    const parentElement = await targetElement.getProperty('parentElement');

    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      parentElement.click(),
    ]);
    await fileChooser.accept([process.env.mediaFolderPath + content.imagePath]);
    console.log('COMPLET: PRESS ADD STORY');


    console.log('WAITING: SEND STORY');
    const selectorButtonSubmitStroy = 'span[aria-label="Add to your story"]';
    await page.waitForSelector(selectorButtonSubmitStroy, { timeout: 6000 });
    await page.click(selectorButtonSubmitStroy);
    await page.waitForSelector(selectorAddContent, { timeout: 20000 });
    console.log('COMPLET: SEND STORY');


    // await takeScreenshot(page, 5000);


    await browser.close();
    browser = null;
  } catch(err) {
    console.log(err);

    // await takeScreenshot(page, 5000);

    await browser.close();
    browser = null;
  }
}

async function takeScreenshot(page, delay = 3000) {
  console.log('WAITING: TAKE A SCREENSHOT');
    await page.waitForTimeout(delay);
    await page.screenshot({
      path: process.env.mediaFolderPath + '/images/screenshot-' + new Date().toISOString() + '.png'
    });
    console.log('COMPLET: TAKE A SCREENSHOT');
}

export async function postToInstagramStories(content) {
  try {
    console.log('====================================');
    console.log('START: POSTING TO INSTAGRAM STORIES');
    // console.log(content);
    
    await runInstagram(content);

    console.log('END: POSTING TO INSTAGRAM STORIES');
    console.log('====================================');
  } catch (err) {
    console.log('ERROR: POSTING TO INSTAGRAM STORIES');
    console.log(err);
  }
}
