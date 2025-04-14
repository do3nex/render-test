const express = require("express");
const { scrape } = require("./scrape");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/api/channel", (req, res) => {
    scrape(req,res);
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
