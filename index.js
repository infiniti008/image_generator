const express = require('express');
const nodeHtmlToImage = require('node-html-to-image');

const app = express();

app.use(express.json());

app.listen(5100);

app.post('/api/render', async function(req, res) {
  console.log('START GENERATING');
  const { html, type = 'png', quality, content, encoding = 'binary', selector, puppeteerArgs = [] } = req.body.data;
  
  const image = await nodeHtmlToImage({
    html,
    type,
    quality,
    content,
    encoding,
    selector,
    puppeteerArgs: {
      args: ['--no-sandbox', ...puppeteerArgs]
    }
  });

  console.log('IMAGE GENERATED');
  
  if (encoding === 'binary') {
    console.log('SENT BINARY IMAGE');
    res.writeHead(200, { 'Content-Type': 'image/' + type });
    res.end(image, encoding);
  } else {
    console.log('SENT BASE64 IMAGE');
    res.send(image);
  }
});