const axios = require('axios');

const WEBHOOK_URL = "https://discord.com/api/webhooks/1361074409020063955/2dYg2CajzR5VAr9CnhvELY1hWFmSknguToevQ8VWIvTHA0uI1nVmMq-NHytegu7ZBwYX";

const startTime = Date.now();

const sendPing = () => {
  const now = Date.now();
  const uptimeSeconds = Math.floor((now - startTime) / 1000);

  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  const content = `**Uptime: ${hours ? hours + "saat ," : null} ${minutes} dakika, ${seconds} saniye**\n`;

  axios.post(WEBHOOK_URL, { content })
    .then(() => console.log("Webhook ping gitti."))
    .catch(err => console.error("Ping atılamadı:", err.response?.data || err.message));
};

setInterval(sendPing, 20000);

//console.log("Uptime webhook botu başlatıldı.");
