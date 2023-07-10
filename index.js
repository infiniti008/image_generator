import * as dotenv from 'dotenv';
dotenv.config({
  path: './.env'
});

import express from 'express';
import fs from 'fs';
import nodeHtmlToImage from 'node-html-to-image';
import { postToInstagramStories } from'./postToInstagramStories.js';

const app = express();

app.use(express.json());

app.listen(5100);

app.post('/api/render', async function(req, res) {
  try {
    console.log('====================================');
    console.log('START GENERATING');
    const { html, type = 'png', quality, content, encoding = 'binary', selector, puppeteerArgs = [], shouldSaveToMediaFolder = true } = req.body.data;
    
    const image = await nodeHtmlToImage({
      html,
      type,
      quality,
      content,
      encoding,
      waitUntil: ['domcontentloaded', 'networkidle0'],
      selector,
      puppeteerArgs: {
        args: ['--no-sandbox', ...puppeteerArgs]
      }
    });

    console.log('IMAGE GENERATED');

    const imagePath = '/images/' + content.fileName + '.png';

    if (shouldSaveToMediaFolder) {
      fs.writeFileSync(process.env.mediaFolderPath + imagePath, image, encoding === 'base64' ? 'base64' : '');
      console.log('IMAGE SAVED TO SHARED MEDIA FOLDER');
      res.json({ imagePath });
      return;
    }
    
    if (encoding === 'binary') {
      console.log('SENT BINARY IMAGE');
      res.writeHead(200, { 'Content-Type': 'image/' + type });
      res.end(image, encoding);
    } else {
      console.log('SENT BASE64 IMAGE');
      res.json({ image });
    }
  } catch (err) {
    console.log(err);
  } finally {
    console.log('====================================');
  }
});

app.post('/api/send-stories', async function(req, res) {
  try {
    const { content } = req.body.data;
    
    await postToInstagramStories(content);

    res.json({ status: true });
  } catch (err) {
    console.log(err);
    res.json({ status: false });
  }
});