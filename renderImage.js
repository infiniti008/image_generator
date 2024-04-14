import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';
const renderImageHost = process.env['renderImageHost_' + env] || 'https://currency.nikitenok-sl.keenetic.link/render?';

async function run(page, config) {
  try {    
    console.log('WAITING: OPEN PAGE');
    await page.goto(config.url);

    console.log('COMPLET: OPEN PAGE');

    console.log('WAITING: WAIT FOR SELECTOR');
    await page.waitForSelector(config.selector, {
      timeout: 60000
    });
    console.log('COMPLET: WAIT FOR SELECTOR');

    console.log('WAITING: TAKE A SCREENSHOT');
    const bodyHandle = await page.$('body');

    await bodyHandle.screenshot({ path: config.imagePath });

    await bodyHandle.dispose();

    console.log('COMPLET: TAKE A SCREENSHOT');

    return { completed: true };
  } catch(err) {
    console.log(err);
    console.log('ERROR: RENDER IMAGE');
    return { completed: false };
  }
}

export async function render(browser, subscription, imagePath) {
  const url = `${renderImageHost}templateName=${subscription.template}&id=${subscription.subscriptionId}`;
  const config = {
    url,
    width: 1080,
    height: 1920,
    selector: '.container.ready',
    imagePath
  };

  const { page, currentPageId } = await browser.createPage();

  const status = await run(page, config);

  await browser.closePage(currentPageId);

  return status;
}
