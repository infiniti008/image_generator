import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});
const env = process.env.environment || 'prod';
const mediaFolderPath = process.env['mediaFolderPath_' + env];

import { launch, logIn, takeScreenshot } from './instagramUtils.js';

let browser  = null;
let page = null;

async function runInstagram(content) {
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
      status.completed = false;
      return status;
    }


    await logIn(page, content);

    console.log('WAITING: SAVE LOGIN INFO');
    await page.goto('https://www.instagram.com/');
    const selectorPresentation = 'div[role="presentation"]';
    await page.waitForSelector(selectorPresentation, { timeout: 6000 });
    await page.waitForTimeout(1000);
    await page.$$eval(selectorPresentation, els => els.forEach(el => el.remove()));
    console.log('COMPLET: SAVE LOGIN INFO');


    console.log('WAITING: PRESS ADD STORY');
    const selectorAddContent = 'a[href="#"]';
    await page.click(selectorAddContent);
    const selectorAddStory = 'svg[aria-label="Story"]';
    await page.waitForSelector(selectorAddStory, { timeout: 6000 });
    const targetElement = await page.$(selectorAddStory);
    const parentElement = await targetElement.getProperty('parentElement');

    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      parentElement.click(),
    ]);
    await fileChooser.accept([mediaFolderPath + content.imagePath]);
    status.logs.push('COMPLET: PRESS ADD STORY');
    console.log('COMPLET: PRESS ADD STORY');


    console.log('WAITING: SEND STORY');
    const selectorButtonSubmitStroy = 'span[aria-label="Add to your story"]';
    await page.waitForSelector(selectorButtonSubmitStroy, { timeout: 6000 });
    await page.click(selectorButtonSubmitStroy);
    await page.waitForSelector(selectorAddContent, { timeout: 20000 });
    status.logs.push('COMPLET: SEND STORY');
    console.log('COMPLET: SEND STORY');


    // await takeScreenshot(page, 5000);


    await browser.close();
    browser = null;
    page = null;
    status.logs.push('COMPLET: CLOSE BROWSER');

    status.completed = true;
    return status;
  } catch(err) {
    console.log(err);
    status.errors.push(err?.message);

    await takeScreenshot(page, 1000);
    await browser.close();
    status.logs.push('COMPLET: TAKE FINAL SCREENSHOT');

    browser = null;
    page = null;
    status.completed = false;
    return status;
  }
}

export async function postToInstagramStories(content) {
  try {
    console.log('====================================');
    console.log('START: POSTING TO INSTAGRAM STORIES');
    console.log(`[ Country = ${content.country} ] [ Name = ${content.name} ] [ File Name = ${content.fileName} ]`);

    const status = await runInstagram(content);

    console.log('END: POSTING TO INSTAGRAM STORIES');
    console.log('====================================');

    return status;
  } catch (err) {
    console.log('ERROR: POSTING TO INSTAGRAM STORIES');
    console.log(err);

    return { 
      completed: false,
      errors: [err?.message]
    };
  }
}

// import fs from 'fs'
// const content = JSON.parse(fs.readFileSync('./content.json').toString());

// postToInstagramStories(content);