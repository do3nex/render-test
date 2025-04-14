const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const puppeteer = require('puppeteer');

app.get('/api/channel', async (req, res) => {
  const channelId = req.query.id;
  if (!channelId) return res.status(400).json({ error: 'channelID is required' });

  try {
    const url = `https://www.youtube.com/channel/${channelId}/videos`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // ytInitialData'yı sayfadan al
    const ytInitialData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      for (let script of scripts) {
        if (script.textContent.includes('var ytInitialData =')) {
          const raw = script.textContent;
          const jsonStr = raw.split('var ytInitialData =')[1].split('};')[0] + '}';
          return JSON.parse(jsonStr);
        }
      }
      return null;
    });

    await browser.close();

    if (!ytInitialData) return res.status(500).json({ error: 'ytInitialData not found' });

    const videoItems = ytInitialData.contents
      ?.twoColumnBrowseResultsRenderer
      ?.tabs?.[1]?.tabRenderer?.content
      ?.sectionListRenderer?.contents?.[0]
      ?.itemSectionRenderer?.contents?.[0]
      ?.gridRenderer?.items;

    if (!videoItems) return res.status(404).json({ error: 'No videos found' });

    const videos = videoItems
      .filter(v => v.gridVideoRenderer && !v.gridVideoRenderer.thumbnailOverlays.some(o => o.thumbnailOverlayTimeStatusRenderer?.style === 'SHORTS'))
      .slice(0, 10)
      .map(v => {
        const vid = v.gridVideoRenderer;
        return {
          videoID: vid.videoId,
          title: vid.title.runs[0].text,
          duration: vid.thumbnailOverlays[0]?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText || null,
          channelName: vid.shortBylineText?.runs[0]?.text || null,
          profilePicture: vid.channelThumbnail?.thumbnails?.[0]?.url || null,
        };
      });

    res.json(videos);
  } catch (err) {
    console.error('🔥 Scraping Error:', err.message);
    res.status(500).json({ error: 'Scraping failed 😓' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 API started on port ${PORT}`);
});
