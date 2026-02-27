require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
    console.log(`Eingeloggt als ${client.user.tag}!`);
});

// Startet den Bot mit dem Token aus der lokalen .env Datei
client.login(process.env.DISCORD_TOKEN);
