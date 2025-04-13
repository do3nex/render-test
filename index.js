const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const WEBHOOK_URL = "https://discord.com/api/webhooks/1361074409020063955/2dYg2CajzR5VAr9CnhvELY1hWFmSknguToevQ8VWIvTHA0uI1nVmMq-NHytegu7ZBwYX";

const startTime = Date.now();

// Uptime formatlayan fonksiyon
const getUptimeMessage = () => {
  const now = Date.now();
  const uptimeSeconds = Math.floor((now - startTime) / 1000);

  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  return `**Uptime: ${hours ? hours + " saat," : ""} ${minutes} dakika, ${seconds} saniye**`;
};

// Webhook'a mesaj atan fonksiyon
const sendPing = () => {
  const content = getUptimeMessage();

  axios.post(WEBHOOK_URL, { content })
    .then(() => console.log("Webhook ping gitti."))
    .catch(err => console.error("Ping atılamadı:", err.response?.data || err.message));
};

// Her 20 saniyede bir webhook'a gönder
setInterval(sendPing, 20000);

// GET isteği geldiğinde aynı mesajı dön
app.get("/", (req, res) => {
  res.send(getUptimeMessage());
});

// Express server'ı başlat
app.listen(port, () => {
  console.log(`Express server aktif: http://localhost:${port}`);
});
