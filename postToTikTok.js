import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';

import fs from 'fs';
import { takeScreenshot, waiting, complete, launch, openUploadPage, upload, variablesByCountry } from './tikTokUtils.js';

let browser = null;
let page = null;


async function runTikTok(content) {
  const status = {
    errors: [],
    logs: [],
  };  
  try {
    const { _page, _browser } = await launch();

    browser = _browser;
    page = _page;

    if (!page && !browser) {
      console.log('ERROR LAUNCH BROWSER');
      status.errors.push('ERROR LAUNCH BROWSER');
      return status;
    }
    let isPageLoaded = false;
    while(!isPageLoaded) {
      isPageLoaded = await openUploadPage(page, content);
      status.logs.push('COMPLET: OPEN UPLOAD PAGE');
    }

    await upload(page, content);
    status.logs.push('COMPLET: UPLOAD VIDEO');


    waiting('CLICK POST BUTTON');
    const selectorButtonPost = '.btn-post';
    // const selectorButtonPost = '.btn-cancel';
    await page.waitForSelector('iframe');

    const elementHandle = await page.$(
      variablesByCountry[content.country].iframeSelector,
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
    status.logs.push('COMPLET: CLEAR DESCRIPTION INPUT');

    await frame.type(selectorDescriptionInput, content.videoTitle + '\r\n' + content.videoDescription);
    status.logs.push('COMPLET: FILL DESCRIPTION INPUT');

    await page.waitForTimeout(1000);

    await frame.click(selectorButtonPost);

    await frame.waitForXPath('//*[contains(text(), "Your videos are being uploaded to TikTok!")]', { timeout: 20000 });
    status.logs.push('COMPLET: CLICK POST BUTTON');
    complete('CLICK POST BUTTON');

    await takeScreenshot(page, 5000);
    await browser.close();
    status.logs.push('COMPLET: TAKE FINAL SCREENSHOT');

    browser = null;
    page = null;
    status.completed = true;
    return status;
  } catch(err) {
    console.log(err);

    await takeScreenshot(page, 1000);
    await browser.close();

    browser = null;
    page = null;
    return {
      completed: false,
      errors: [err?.message]
    };
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
    return {
      completed: false,
      errors: [err?.message]
    };
  }
}

// const content = JSON.parse(fs.readFileSync('./content.json').toString());

// postToTikTok(content);

