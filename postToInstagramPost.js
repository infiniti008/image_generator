import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';
const mediaFolderPath = process.env['mediaFolderPath_' + env];

import { logIn, removeCookies, takeScreenshot, variablesByCountry, launch } from './instagramUtils.js';

let browser = null;
let page = null;

async function runInstagram(content) {
  try {
    const { _page, _browser } = await launch();

    browser = _browser;
    page = _page;

    if (!page && !browser) {
      console.log('ERROR LAUNCH BROWSER');
      return;
    }


    await logIn(page, content);


    console.log('WAITING: SWITCH TO DESKTOP');
    await page.emulate({
      name: 'Desktop 1280',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      viewport: {
        width: 1280,
        height: 800
      }
    });
    await page.reload({ waitUntil: 'networkidle0' });
    console.log('COMPLET: SWITCH TO DESKTOP');


    console.log('WAITING: TURN OFF NOTIFICATIONS');
    try {
      await page.waitForXPath('//*[contains(text(), "Turn on Notifications")]', { timeout: 6000 });
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      console.log('SUCCESS: TURN OFF NOTIFICATIONS');
    } catch(err) {
      console.log(err?.message);
      console.log('ERROR: TURN OFF NOTIFICATIONS');
    }
    console.log('COMPLET: TURN OFF NOTIFICATIONS');


    console.log('WAITING: CLICK ADD POST');
    const selectorAddPost = 'svg[aria-label="New post"]';
    const addPostSVGElement = await page.$(selectorAddPost);
    const addPostElement = await addPostSVGElement.getProperty('parentElement');
    await addPostElement.click();
    console.log('COMPLET: CLICK ADD POST');



    const selectorPostInput = 'input[accept*="video/mp4"]';
    await page.waitForSelector(selectorPostInput, { timeout: 6000 });


    console.log('WAITING: ADD FILE');
    await page.waitForXPath('//*[contains(text(), "Select from computer")]', { timeout: 6000 });
    const [buttonSelectFromComputer] = await page.$x('//*[contains(text(), "Select from computer")]');
    if (buttonSelectFromComputer) {
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        buttonSelectFromComputer.click()
      ]);
      await fileChooser.accept([mediaFolderPath + content.videoPath]);
    }
    console.log('COMPLET: ADD FILE');


    console.log('WAITING: CONFIRM POSTS AS REELS');
    try {
      await page.waitForXPath('//*[contains(text(), "Video posts are now shared as reels")]', { timeout: 6000 });
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      console.log('SUCCESS: CONFIRM POSTS AS REELS');
    } catch(err) {
      console.log(err?.message);
      console.log('ERROR: CONFIRM POSTS AS REELS');
    }
    console.log('COMPLET: CONFIRM POSTS AS REELS');


    console.log('WAITING: CLICK CROP BUTTON');
    const selectorCropButton = 'svg[aria-label="Select crop"]';
    const cropButtonSVGElement = await page.$(selectorCropButton);
    const cropButtonElement = await cropButtonSVGElement.getProperty('parentElement');
    await cropButtonElement.click();
    console.log('COMPLET: CLICK CROP BUTTON');


    console.log('WAITING: CLICK ORIGINAL BUTTON');
    const selectorOriginalButton = 'svg[aria-label="Photo outline icon"]';
    const originalButtonSVGElement = await page.$(selectorOriginalButton);
    const originalButtonElement = await originalButtonSVGElement.getProperty('parentElement');
    await originalButtonElement.click();
    console.log('COMPLET: CLICK ORIGINAL BUTTON');
    

    console.log('WAITING: CLICK NEXT-1 BUTTON');
    const [buttonNext1] = await page.$x("//div[contains(., 'Next')] [@role='button']");
    if (buttonNext1) {
      await buttonNext1.click();
    }
    console.log('COMPLET: CLICK NEXT-1 BUTTON');



    console.log('WAITING: CLICK NEXT-2 BUTTON');
    await page.waitForTimeout(1000);
    const [buttonNext2] = await page.$x("//div[contains(., 'Next')] [@role='button']");
    if (buttonNext2) {
      await buttonNext2.click();
    }
    console.log('COMPLET: CLICK NEXT-2 BUTTON');


    console.log('WAITING: FILL TITLE AND DESCRIPTION');
    const selectorDescriptionInput = 'div[data-lexical-editor="true"]';
    await page.type(selectorDescriptionInput, content.videoTitle + '\r\n' + content.videoDescription);

    const selectorCityInput = 'input[name="creation-location-input"]';
    await page.type(selectorCityInput, variablesByCountry[content.country].cityName);
    console.log('COMPLET: FILL TITLE AND DESCRIPTION');


    // console.log('WAITING: CLICK SHARE BUTTON');
    // await page.waitForTimeout(1000);
    // const [buttonShare] = await page.$x("//div[contains(., 'Share')] [@role='button']");
    // if (buttonShare) {
    //   await buttonShare.click();
    // }
    // console.log('COMPLET: CLICK SHARE BUTTON');


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
    removeCookies(content);
    return false;
  }
}

export async function postToInstagramReels(content) {
  try {
    console.log('====================================');
    console.log('START: POSTING TO INSTAGRAM REELS');
    console.log(`[ Country = ${content.country} ] [ Name = ${content.name} ] [ File Path = ${content.videoPath} ]`);
    
    const status = await runInstagram(content);

    console.log('END: POSTING TO INSTAGRAM REELS');
    console.log('====================================');

    return { status };
  } catch (err) {
    console.log('ERROR: POSTING TO INSTAGRAM REELS');
    console.log(err);
    return { status: false };
  }
}
