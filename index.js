
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Ping route
app.get("/", (req, res) => {
  res.send("Bot is alive and vibin’ bro!");
});

// Start Express
app.listen(port, () => {
  console.log(`Express aktif! PORT: ${port}`);
});

// Dummy Discord Bot (çalışmayacak ama kodda dursun)
const { Client, GatewayIntentBits } = require("discord.js");
const bot = new Client({ intents: [GatewayIntentBits.Guilds] });

bot.once("ready", () => {
  console.log(`Bot is online as ${bot.user.tag}`);
});

// Token boş, yani bot connect olmayacak (safety first)
//bot.login("DISCORD_BOT_TOKEN_GIRME_BU_KOD_TEST_ICIN");
