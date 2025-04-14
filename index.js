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
        const pageContent = await page.content();
        console.log("📄 Sayfa içeriği ilk 1000 karakter:", pageContent.slice(0, 1000));
        
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
          });

        console.log('🧭 Sayfa açılıyor...');
        await page.goto(url, { waitUntil: 'networkidle2' });
        console.log('✅ Sayfa yüklendi.');

        await page.evaluate(() => {
            window.scrollTo(0, 2000);
        });

        console.log('🔽 Sayfa scroll edildi, daha fazla video yüklendi.');

        await page.waitForSelector('#contents ytd-rich-item-renderer', { timeout: 10000 });
        console.log('✅ Video grid bulundu.');

        const videos = await page.evaluate(() => {
            try {
                const nodes = Array.from(document.querySelectorAll('#contents ytd-rich-item-renderer'));
                const channelName = document.querySelector('h1.dynamic-text-view-model-wiz__h1')?.innerText?.trim();
                const profilePicture = document.querySelector('img[src*="yt3.googleusercontent.com"]')?.src;

                const data = nodes.map(node => {
                    const title = node.querySelector('#video-title')?.textContent?.trim();
                    const isShorts = node.querySelector('a[href*="/shorts/"]') !== null;
                    const duration = node.querySelector('span.ytd-thumbnail-overlay-time-status-renderer')?.textContent?.trim();

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
                        isShorts,
                        channel: {
                            channelName,
                            profilePicture
                        }
                    };
                });

                return data;
            } catch (e) {
                return { error: true, message: e.message };
            }
        });
        console.log("📦 Gelen veri:", typeof videos, Array.isArray(videos) ? videos.length + " video var" : videos);

        await browser.close();

        if (!Array.isArray(videos)) {
            console.error('❌ evaluate sonucu array değil:', videos);
            return res.status(500).json({ error: 'Evaluate error', raw: videos });
        }

        const filtered = videos.filter(v => !v.isShorts && v.videoID).slice(0, 10);

        console.log(`🎯 ${filtered.length} adet video bulundu (Shorts hariç).`);
        filtered.forEach((v, i) => {
            console.log(`#${i + 1}: ${v.title} [${v.videoID}]`);
        });

        res.json(filtered.map(({ isShorts, ...rest }) => rest));
    } catch (err) {
        console.error('🔥 Hata oluştu:', err);
        res.status(500).json({ error: 'Scraping failed 😓', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server başladı: http://localhost:${PORT}`);
});
