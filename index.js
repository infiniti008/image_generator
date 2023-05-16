const express = require('express');
const nodeHtmlToImage = require('node-html-to-image');

const app = express();

app.listen(5100);

app.get(`/api/currency/render`, async function(req, res) {
  
  const html = req.query.html;
  const image = await nodeHtmlToImage({
    html: html,
    puppeteerArgs: {
      args: ['--no-sandbox']
    }
  });
  console.log('IMAGE GENERATED');
  res.writeHead(200, { 'Content-Type': 'image/png' });
  res.end(image, 'binary');
});