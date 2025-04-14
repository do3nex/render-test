const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/channel', async (req, res) => {
    const channelId = req.query.id;
    if (!channelId) {
        console.log('❌ channelID parametresi eksik.');
        return res.status(400).json({ error: 'channelID is required' });
    }

    try {
        const url = `https://www.youtube.com/channel/${channelId}/videos`;
        console.log(`🌐 YouTube kanalına gidiliyor: ${url}`);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2' });
        console.log('✅ Sayfa yüklendi.');

        await page.evaluate(() => {
            window.scrollTo(0, 2000);
        });

        console.log('🔽 Sayfa scroll edildi, daha fazla video yüklendi.');

        await page.waitForSelector('#contents ytd-rich-item-renderer', { timeout: 10000 });
        console.log('✅ Video grid bulundu.');

        const videos = await page.evaluate(() => {
            const nodes = Array.from(document.querySelectorAll('#contents ytd-rich-item-renderer'));

            const data = nodes.map(node => {
                const title = node.querySelector('#video-title')?.textContent?.trim();
                const isShorts = node.querySelector('a[href*="/shorts/"]') !== null;
                const duration = node.querySelector('span.ytd-thumbnail-overlay-time-status-renderer')?.textContent?.trim();

                const channelName = document.querySelector('h1.dynamic-text-view-model-wiz__h1')?.innerText?.trim();
                const profilePicture = document.querySelector('img[src*="yt3.googleusercontent.com"]')?.src;

                const thumbnail = node.querySelector('img')?.src;
                let videoID = null;
                if (thumbnail && thumbnail.includes('/vi/')) {
                    const match = thumbnail.match(/\/vi\/([^/]+)\//);
                    if (match && match[1]) videoID = match[1];
                }

                return {
                    videoID,
                    title,
                    duration,

                    channel: {
                        channelName,
                        profilePicture
                    }
                };
            });

            return data;
        });

        await browser.close();

        const filtered = videos.filter(v => !v.isShorts && v.videoID).slice(0, 10);

        console.log(`🎯 ${filtered.length} adet video bulundu (Shorts hariç).`);
        res.json(filtered.map(({ isShorts, ...rest }) => rest));
    } catch (err) {
        console.error('🔥 Hata oluştu:', err);
        res.status(500).json({ error: 'Scraping failed 😓', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server başladı: http://localhost:${PORT}`);
});
