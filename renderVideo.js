import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

const env = process.env.environment || 'prod';
const mediaFolderPath = process.env['mediaFolderPath_' + env];
const renderImageHost = process.env['renderImageHost_' + env] || 'http://192.168.1.42:8045/render?';

async function run (page, config, recorderConfig, subscription) {
  try {
    await page.setViewport({
      width: config.width,
      height: config.height
    });

    console.log('WAITING: OPEN PAGE - ', config.url);
    await page.goto(config.url);
    console.log('COMPLET: OPEN PAGE');
    
    console.log('WAITING: WAIT FOR READY SELECTOR');
    await page.waitForSelector('.video-general-wrapper.show');
    console.log('COMPLET: WAIT FOR READY SELECTOR');

    console.log('WAITING: RECORDING VIDEO');
    const recorder = new PuppeteerScreenRecorder(page, recorderConfig);
    await recorder.start(config.videoPath);

    await page.waitForSelector('.video-general-wrapper.finished', {
      timeout: 90000
    });

    await recorder.stop();
    console.log('COMPLET: RECORDING VIDEO');

    if (subscription.pathToAudio) {
      console.log('ADD AUDIO TO VIDEO - START');
      const audioPath = mediaFolderPath + subscription.pathToAudio;
      
      let tempFilePath = config.videoPath.split('.mp4');
      tempFilePath[0] = tempFilePath[0] + '_temp';
      tempFilePath = tempFilePath.join('.mp4');

      await fs.promises.rename(config.videoPath, tempFilePath);

      const addAudioResult = await addAudioToVideo(config.videoPath, audioPath, tempFilePath);

      if (!addAudioResult) {
        await fs.promises.rename(tempFilePath, config.videoPath);
        console.log('ADD AUDIO TO VIDEO - FAILED');
      } else {
        await fs.promises.unlink(tempFilePath);
        console.log('ADD AUDIO TO VIDEO - COMPLETED');
      }
    }

    return { completed: true, videoPath: config.videoPath, url: config.url};
  } catch(err) {
    console.log(err);
    console.log('ERROR: RENDER VIDEO');
    return { completed: false, errors: [err?.message], url: config.url };
  }
}


export async function renderVideo(browser, subscription, videoPath) {
  const url = `${renderImageHost}templateName=${subscription.template}&id=${subscription.subscriptionId}`;
  const config = {
    url,
    width: parseInt(subscription.width),
    height: parseInt(subscription.height),
    videoPath
  };

  const recorderConfig = {
    followNewTab: false,
    fps: 25,
    videoFrame: {
      width: parseInt(subscription.width),
      height: parseInt(subscription.height),
    },
    videoCrf: 18,
    videoCodec: 'libx264',
    videoPreset: 'ultrafast',
    videoBitrate: 3000,
    autopad: {
      color: 'black' | '#35A5FF',
    },
    aspectRatio: '9:16',
    recordDurationLimit: 100
  };

  const { page, currentPageId } = await browser.createPage();

  const status = await run(page, config, recorderConfig, subscription);

  await browser.closePage(currentPageId);

  return status;
}

function addAudioToVideo(videoPath, audioPath, tempFilePath) {
  return new Promise(async (resolve) => {
    new ffmpeg()
      .addInput(tempFilePath)
      .addInput(audioPath)
      .outputOptions(['-map 0:v', '-map 1:a', '-c:v copy', '-shortest'])
      .saveToFile(videoPath)
      .on('end', () => {
        resolve(true);
      })
      .on('error', (err) => {
        console.log(err)
        resolve(false);
      });
  });
}