import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';
const mediaFolderPath = process.env['mediaFolderPath_' + env];
const doNotDisplayCookieModalCookie_eig_did = process.env.doNotDisplayCookieModalCookie_eig_did;

export const variablesByCountry = {
  pl: {
    cityName: 'Warsaw, Poland',
    cookies: [
      {
        "name": "ig_did",
        "value": doNotDisplayCookieModalCookie_eig_did,
        "domain": ".instagram.com",
        "path": "/",
        "expires": 1720861283.380388,
        "size": 42,
        "httpOnly": true,
        "secure": true,
        "session": false,
        "sameParty": false,
        "sourceScheme": "Secure",
        "sourcePort": 443
      }
    ]
  },
  by: {
    cityName: 'Minsk, Belarus',
    cookies: [
      {
        "name": "ig_did",
        "value": doNotDisplayCookieModalCookie_eig_did,
        "domain": ".instagram.com",
        "path": "/",
        "expires": 1720861283.380388,
        "size": 42,
        "httpOnly": true,
        "secure": true,
        "session": false,
        "sameParty": false,
        "sourceScheme": "Secure",
        "sourcePort": 443
      }
    ]
  }
};

export async function takeScreenshot(page, delay = 3000) {
  console.log('WAITING: TAKE A SCREENSHOT');
  const screenshotPath = env === 'prod' 
    ? mediaFolderPath + '/images/' + new Date().toLocaleDateString('ru-RU') + '-screenshot-' + new Date().toLocaleTimeString('ru-RU').replace(', ','-') + '.png' 
    : 'img.png';
  await page.waitForTimeout(delay);
  await page.screenshot({
    path: screenshotPath
  });
  console.log('SCREENSHOT PATH: ' + screenshotPath);
  console.log('COMPLET: TAKE A SCREENSHOT');
}


export async function logIn(page, content) {

  console.log('WAITING: OPEN PAGE');
  await page.goto('https://www.instagram.com/');
  await page.setViewport({
    width: 756,
    height: 1344
  });
  console.log('COMPLET: OPEN PAGE');

  console.log('WAITING: CHECK LOGIN BEFORE LOGIN');
  try {
    const selectorMenu = 'div[role="menu"]';
    await page.waitForSelector(selectorMenu, { timeout: 2000 });
    return;
  } catch(err) {
    console.log(err);
    await takeScreenshot(page, 1000);
  }
  console.log('COMPLET: CHECK LOGIN BEFORE LOGIN');

  console.log('WAITING: CHECK LOGIN');
  const selectorAddContent = 'a[href="#"]';
  let isLoggedInByCookies = false;
  let isLoggedInByLogin = false;

  if (!isLoggedInByCookies) {
    console.log('WAITING: CLICK ACEPT COOCKIE BUTTON');
    const selectorCoockieDialog = 'div[role="dialog"]';
    try {
      await page.waitForXPath('//*[contains(text(), "Allow all cookies")]', { timeout: 1000 });
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
      await page.waitForXPath('//*[contains(text(), "Save your login info?")]', { timeout: 6000 });

      await page.goto('https://www.instagram.com/');
    } catch (err) {
      console.log(err?.message);
      console.log('ERROR: CLICK SAVE INFO TO LOGIN');
    }
    console.log('COMPLET: CLICK SAVE INFO TO LOGIN');


    console.log('WAITING: CHECK LOGIN AFTER LOGIN');
    try {
      const selectorMenu = 'div[role="menu"]';
      await page.waitForSelector(selectorMenu, { timeout: 10000 });
      isLoggedInByLogin = true;
    } catch(err) {
      console.log(err);
      await takeScreenshot(page, 1000);
    }
    console.log('COMPLET: CHECK LOGIN AFTER LOGIN - ', isLoggedInByLogin);
  }
}