const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/channel', async (req, res) => {
  const channelId = req.query.id;
  if (!channelId) return res.status(400).json({ error: 'channelID is required' });

  try {
    const url = `https://www.youtube.com/channel/${channelId}/videos`;
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      }
    });

    const $ = cheerio.load(html);
    const scripts = $('script').toArray();
    let ytInitialData;

    for (const script of scripts) {
      const content = $(script).html();
      if (content && content.includes('var ytInitialData =')) {
        const jsonStr = content.split('var ytInitialData =')[1].split(';</script>')[0].trim();
        ytInitialData = JSON.parse(jsonStr);
        break;
      }
    }

    if (!ytInitialData) return res.status(500).json({ error: 'Failed to parse data' });

    const videoItems = ytInitialData.contents
      ?.twoColumnBrowseResultsRenderer
      ?.tabs[1]?.tabRenderer?.content
      ?.sectionListRenderer?.contents[0]
      ?.itemSectionRenderer?.contents[0]
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
    console.error(err);
    res.status(500).json({ error: 'Something went wrong, fam 😓' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API started on port ${PORT}`);
});
