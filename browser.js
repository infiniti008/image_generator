import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';
const executablePath = process.env['executablePath_' + env];
const headless = env === 'prod' ? true : false;
const slowMo =  env === 'prod' ? 0 : 10;

import puppeteer from 'puppeteer';

export default class Browser {
  constructor() {
    this.browser = null;
    this.pages = {};
    this.pageId = 0;

    this.launch();
  }

  async launch() {
    console.log('[BROWSER] - WAITING: LAUNCH BROWSER');
    try {
      this.browser = await puppeteer.launch({
        executablePath,
        headless,
        slowMo,
        args: ['--no-sandbox', '--lang=en-US'],
        ignoreHTTPSErrors: true
      });
      console.log('[BROWSER] - COMPLET: LAUNCH BROWSER');
      return this.browser;
    } catch(err) {
      console.log(err?.message);
      console.log('[BROWSER] - ERROR: LAUNCH BROWSER');
      return null;
    }
  }

  async close() {
    console.log('WAITING: CLOSE BROWSER');
    try {
      await this.browser.close();
      console.log('COMPLET: CLOSE BROWSER');
    } catch(err) {
      console.log(err?.message);
      console.log('ERROR: CLOSE BROWSER');
    }
  }

  async createPage() {
    console.log('WAITING: CREATE PAGE');
    try {
      this.pageId++;
      const currentPageId = this.pageId;
      const page = await this.browser.newPage();
      this.pages[this.pageId] = page;
      
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en'
      });
      console.log('COMPLET: CREATE PAGE');

      setTimeout(async () => {
        try {
          await this.closePage(currentPageId, true);
        } catch(err) {
          console.log(err?.message);
        }
      }, 1000 * 60 * 5);

      return { page, currentPageId };
    } catch(err) {
      console.log(err?.message);
      console.log('ERROR: CREATE PAGE');
      return null;
    }
  }

  async closePage(pageId, closeByTimeout = false) {
    const byTimeoutText = closeByTimeout ? ' BY TIMEOUT' : '';
    try {
      if (this.pages[pageId]) {
        console.log('WAITING: CLOSE PAGE' + byTimeoutText);
        await this.pages[pageId].close();
        delete this.pages[pageId];
        console.log('COMPLET: CLOSE PAGE' + byTimeoutText);
      }
    } catch(err) {
      console.log(err?.message);
      console.log('ERROR: CLOSE PAGE' + byTimeoutText);
    }
  }
}
