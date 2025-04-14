const express = require("express");
const { scrape } = require("./scrapex");
const app = express();

const PORT = process.env.PORT || 4000;

app.get("/api/channel", (req, res) => {
    scrape(res);
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
