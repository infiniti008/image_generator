import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

import puppeteer from 'puppeteer';
const env = process.env.environment || 'prod';

import { logIn, takeScreenshot } from './instagramUtils.js';

async function runInstagram(page, subscription) {
  const status = {
    errors: [],
    logs: [],
  };
  try {
    const m = puppeteer.devices['iPhone 13 Pro'];
    await page.emulate(m);
    status.logs.push('COMPLET: OPEN PAGE');

    await logIn(page, subscription);

    console.log('WAITING: SAVE LOGIN INFO');
    const selectorPresentation = 'div[role="presentation"]';
    await page.waitForSelector(selectorPresentation, { timeout: 6000 });
    await page.waitForTimeout(1000);
    await page.$$eval(selectorPresentation, els => els.forEach(el => el.remove()));
    status.logs.push('COMPLET: LOG IN');
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
    await fileChooser.accept([subscription.imagePath]);
    status.logs.push('COMPLET: PRESS ADD STORY');
    console.log('COMPLET: PRESS ADD STORY');


    console.log('WAITING: SEND STORY');
    const selectorButtonSubmitStroy = 'span[aria-label="Add to your story"]';
    await page.waitForSelector(selectorButtonSubmitStroy, { timeout: 6000 });
    await page.click(selectorButtonSubmitStroy);
    await page.waitForSelector(selectorAddContent, { timeout: 20000 });
    status.logs.push('COMPLET: SEND STORY');
    console.log('COMPLET: SEND STORY');

    status.completed = true;
    return status;
  } catch(err) {
    console.log(err);
    status.errors.push(err?.message);

    await takeScreenshot(page, 1000);

    status.completed = false;
    return status;
  }
}

export async function postToInstagramStories(browser, subscription) {
  try {
    console.log('====================================');
    console.log('START: POSTING TO INSTAGRAM STORIES');
    console.log(`[ Country = ${subscription.country} ] [ Name = ${subscription.name} ] [ File Name = ${subscription.fileName} ]`);

    const { page, currentPageId } = await browser.createPage();

    const status = await runInstagram(page, subscription);

    await browser.closePage(currentPageId);

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
