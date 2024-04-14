import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';
const executablePath = process.env['executablePath_' + env];
const slowMo =  env === 'prod' ? 0 : 10;
import { variablesByCountry } from './instagramUtils.js';

import puppeteer from 'puppeteer';

export default class Browser {
  constructor() {
    this.browser = null;
    this.pages = {};
    this.pageId = 0;
    this.context_by = null;
    this.context_pl = null;
    this.pageInstagram_by = null;
    this.pageInstagram_pl = null;

    this.launch();
  }

  async launch() {
    console.log('[= BROWSER =] - WAITING: LAUNCH BROWSER');
    try {
      this.browser = await puppeteer.launch({
        executablePath,
        headless: true,
        slowMo,
        args: ['--no-sandbox', '--lang=en-US'],
        ignoreHTTPSErrors: true
      });
      console.log('[= BROWSER =] - COMPLET: LAUNCH BROWSER');

      await this.openContextByCountry('by');
      await this.openContextByCountry('pl');

      return this.browser;
    } catch(err) {
      console.log(err?.message);
      console.log('[= BROWSER =] - ERROR: LAUNCH BROWSER');
      return null;
    }
  }

  async openContextByCountry(countryCode) {
    console.log('[= BROWSER =] - START: OPEN CONTEXT BY COUNTRY - ', countryCode);
    try {
      const contextName = `context_${countryCode}`;
      const context = await this.browser.createIncognitoBrowserContext();
      this[contextName] = context;

      await this.openInstagramPage(countryCode, context);

      console.log('[= BROWSER =] - COMPLETED: OPEN CONTEXT BY COUNTRY - ', countryCode);
    } catch(err) {
      console.log('[= BROWSER =] - ERROR: OPEN CONTEXT BY COUNTRY - ', countryCode);
      console.log(err?.message);
    }
  }

  async openInstagramPage(countryCode, context) {
    try {
      const instagramPageName = `pageInstagram_${countryCode}`;
      const instagramPage = await context.newPage();
      this[instagramPageName] = instagramPage;
      await instagramPage.setExtraHTTPHeaders({
        'Accept-Language': 'en'
      });

      const savedCookies = variablesByCountry[countryCode].cookies;
      await instagramPage.setCookie(...savedCookies);
      await this.pageGoToHomePageInstagram(countryCode);
    } catch(err) {
      console.log(err?.message);
    }
  }

  async openTiktokPage(countryCode, context) {
    try {
      const tiktokPageName = `pageTiktok_${countryCode}`;
      const tiktokPage = await context.newPage();
      this[tiktokPageName] = tiktokPage;
      await tiktokPage.setExtraHTTPHeaders({
        'Accept-Language': 'en'
      });

      const savedCookies = variablesByCountry[countryCode].cookies;
      await instagramPage.setCookie(...savedCookies);
      await this.pageGoToHomePageInstagram(countryCode);
    } catch(err) {
      console.log(err?.message);
    }
  }

  async pageGoToHomePageInstagram(countryCode) {
    try {
      const instagramPageName = `pageInstagram_${countryCode}`;
      const instagramPage = this[instagramPageName];
      await instagramPage.goto(`https://www.instagram.com/?${countryCode}`);
    } catch(err) {
      console.log(err?.message);
    }
  }

  // async pageGoToHomePageTikTok(countryCode) {
  //   try {
  //     const instagramPageName = `pageInstagram_${countryCode}`;
  //     const instagramPage = this[instagramPageName];
  //     await instagramPage.goto(`https://www.instagram.com/?${countryCode}`);
  //   } catch(err) {
  //     console.log(err?.message);
  //   }
  // }

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
