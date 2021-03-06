import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';

const app = express();

async function getHTML(url) {
  const resp = await axios(url, {
    responseType: 'text',
  });
  return resp.data;
}

function parseHTML(html) {
  const $ = cheerio.load(html);
  // NOTE: we can't save cheerio elements inside variables or else
  // attributes attr() will return null
  const getMetatag = (prop) =>
    $(`meta[name='${prop}']`).attr('content') ||
    $(`meta[property='og:${prop}']`).attr('content') ||
    $(`meta[property='twitter:${prop}']`).attr('content');

  const hasVideo = () => $('video').length;

  // NOTE: we add a default empty string so properties will still have a value
  // w/c is empty string ('') or else they won't be included when parsed as
  // JSON strings because null values are ignored
  const data = {
    description: getMetatag('description') || '',
    image: getMetatag('image') || '',
    title: getMetatag('title') || '',
    author: getMetatag('author') || '',
    type: getMetatag('type') || '',
    url: getMetatag('url') || '',
    video: !!hasVideo(),
  };
  return data;
}

app.get('/', async (req, res, next) => {
  try {
    const url = 'https://twitter.com/home';
    const html = await getHTML(url);
    const data = parseHTML(html);
    res.json(data);
  } catch (error) {
    console.log({ error });
    next(error);
  }
});

app.use(function (err, req, res, next) {
  res.status(res.statusCode || 500).json({
    message: 'Server error',
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening to ${PORT}`);
});
