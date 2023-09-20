import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';

import fs from 'fs';
import { takeScreenshot, waiting, complete, launch, openUploadPage, upload } from './tikTokUtils.js';

let browser = null;
let page = null;


async function runTikTok(content) {
  try {
    const { _page, _browser } = await launch();

    browser = _browser;
    page = _page;

    if (!page && !browser) {
      console.log('ERROR LAUNCH BROWSER');
      return;
    }
    let isPageLoaded = false;
    while(!isPageLoaded) {
      isPageLoaded = await openUploadPage(page, content);
    }

    await upload(page, content);


    waiting('CLICK POST BUTTON');
    const selectorButtonPost = '.btn-post';
    // const selectorButtonPost = '.btn-cancel';
    await page.waitForSelector('iframe');

    const elementHandle = await page.$(
      'iframe[src="https://www.tiktok.com/creator#/upload?lang=en"]',
    );
    const frame = await elementHandle.contentFrame();
    await frame.waitForXPath('//*[contains(text(), "Edit video")]', { timeout: 20000 });


    let isReadyToPost = false;

    while(!isReadyToPost) {
      const data = await frame.evaluate(() => {
        const element = document.querySelector('.btn-post')?.children[0];
    
        return window.getComputedStyle(element).getPropertyValue('background-color');
      });

      isReadyToPost = data === 'rgb(254, 44, 85)';
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(5000);

    const selectorDescriptionInput = 'div.notranslate.public-DraftEditor-content';
    await frame.waitForSelector(selectorDescriptionInput);
    await frame.focus(selectorDescriptionInput);
    await frame.click(selectorDescriptionInput);

    for(let i = 0; i < 100; i++) {
      await page.keyboard.press('Backspace')
      await frame.waitForTimeout(50);
      await page.keyboard.press('Delete')
      await frame.waitForTimeout(50);
    }

    await frame.type(selectorDescriptionInput, content.videoTitle + '\r\n' + content.videoDescription);

    await page.waitForTimeout(1000);

    await frame.click(selectorButtonPost);

    await frame.waitForXPath('//*[contains(text(), "Your videos are being uploaded to TikTok!")]', { timeout: 20000 });
    complete('CLICK POST BUTTON');

    await takeScreenshot(page, 5000);
    await browser.close();

    browser = null;
    page = null;
    return true;
  } catch(err) {
    console.log(err);

    await takeScreenshot(page, 1000);
    await browser.close();

    browser = null;
    page = null;
    return false;
  }
}

export async function postToTikTok(content) {
  try {
    console.log('====================================');
    console.log('START: POSTING TO TIK TOK');
    console.log(`[ ${content.time} ] [ ${content.country} ] [ ${content.name} ] [ ${content.videoPath} ]`);
    
    const status = await runTikTok(content);

    console.log('END: POSTING TO TIK TOK');
    console.log('====================================');

    return status;
  } catch (err) {
    console.log('ERROR: POSTING TO TIK TOK');
    console.log(err);
    return false;
  }
}

// const content = JSON.parse(fs.readFileSync('./content.json').toString());

// postToTikTok(content);

