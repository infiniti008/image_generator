// open browser. then open page and then find tags a and get all src from them
import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

import puppeteer from 'puppeteer';

const env = process.env.environment || 'prod';
const executablePath = process.env['executablePath_' + env];

export const getMylioPhoto = async (url) => {
  // Launch the browser
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    slowMo: 10,
    args: ['--no-sandbox', '--lang=en-US'],
    ignoreHTTPSErrors: true
  });
  const page = await browser.newPage();

  // Open the page
  await page.goto(url); // Replace with your URL

  await page.waitForSelector('a.imageListItem img');

  // Find all <a> tags and get their href attributes
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a.imageListItem img')).map(img => img.src);
  });

  // console.log(links);

  // Close the browser
  await browser.close();

  return links;
}

// getMylioPhoto('https://share.mylio.com/769334aebc651f62be29558561af723fb8da580c/422cfe8e0f423a839a45fce12493686f10addcd8/');
