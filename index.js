import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

const env = process.env.environment || 'prod';
const mediaFolderPath = process.env['mediaFolderPath_' + env];

import express from 'express';
import { DateTime } from 'luxon';
import { postToInstagramStories } from'./postToInstagramStories.js';
import { postToInstagramReels } from './postToInstagramPost.js';
import { postToTikTok } from './postToTikTok.js';
import { render } from './renderImage.js';
import { renderVideo } from './renderVideo.js';
// import { getMylioPhoto } from './getMylioPhoto.js';
import Browser from './browser.js';

const browser = new Browser();
const app = express();

app.use(express.json({limit: '50mb'}));

app.listen(5100, () => {
  console.log('[= SERVER =] - APP LISTEN INTERNAL PORT: 5100');
});

app.post('/api/send-stories', async function(req, res) {
  try {
    const { subscription } = req.body.data;
    
    const status = await postToInstagramStories(browser, subscription);

    res.json(status);
  } catch (err) {
    console.log(err);
    res.json({
      completed: false,
      errors: [err?.message]
    });
  }
});

app.post('/api/send-reels', async function(req, res) {
  try {
    const { subscription } = req.body.data;
    
    const status = await postToInstagramReels(browser, subscription);

    res.json(status);
  } catch (err) {
    console.log(err);
    res.json({
      completed: false,
      errors: [err?.message]
    });
  }
});

app.post('/api/send-tiktok', async function(req, res) {
  try {
    const { subscription } = req.body.data;
    
    const status = await postToTikTok(browser, subscription);

    res.json(status);
  } catch (err) {
    console.log(err);
    res.json({
      completed: false,
      errors: [err?.message]
    });
  }
});

app.post('/api/render/video', async function(req, res) {
  try {
    const { subscription } = req.body.data;
    const nowTime = DateTime.fromJSDate(new Date(), { zone: getTimezone(subscription) });
    const date = nowTime.toFormat('yyyy.MM.dd'); 
    const subscriptionPrint = `[ ${subscription.time} ] [ ${subscription.country} ] [ ${subscription.titleTextTemplate} ] [ Template: ${subscription.template} ]`;
    console.log('====================================');
    console.log('START GENERATING VIDEO: ' + subscriptionPrint);

    const fileName = `${date}-${subscription.time}-${subscription.subscriptionId}`;
    const videoPath = mediaFolderPath + '/videos/' + fileName + '.mp4';
    
    const status = await renderVideo(browser, subscription, videoPath);

    res.json(status);
  } catch (err) {
    console.log(err);
    res.json({
      completed: false,
      errors: [err?.message]
    });
  }
});

app.post('/api/render/image', async function(req, res) {
  try {
    const { subscription } = req.body.data;
    const nowTime = DateTime.fromJSDate(new Date(), { zone: getTimezone(subscription) });
    const date = nowTime.toFormat('yyyy.MM.dd'); 
    const subscriptionPrint = `[ ${subscription.time} ] [ ${subscription.country} ] [ ${subscription.name} ] [ Template: ${subscription.template} ]`;
    console.log('====================================');
    
    console.log('START GENERATING IMAGES: ' + subscriptionPrint);
    const fileName = `${date}-${subscription.time}-${subscription.subscriptionId}`;
    const imagePath = mediaFolderPath + '/images/' + fileName + '.png';
    const renderResult = await render(browser, subscription, imagePath);
    console.log('IMAGE GENERATED -', renderResult.completed);
    
    const result = { imagePath, ...renderResult };
    res.json(result);
    return;
  } catch (err) {
    console.log(err);
    res.json({ completed: false, errors: [err?.message] });
  } finally {
    console.log('====================================');
  }
});

// app.get('/api/get-mylio-photo', async function(req, res) {
//   try {
//     const { url } = req.query;
//     const links = await getMylioPhoto(url);
//     res.json(links);
//   } catch (err) {
//     console.log(err);
//     res.json([]);
//   }
// });

function getTimezone(subscription) {
  if (subscription.country === 'by') {
    return 'Europe/Minsk';
  } else if(subscription.country === 'pl') {
    return 'Europe/Warsaw';
  }
}
