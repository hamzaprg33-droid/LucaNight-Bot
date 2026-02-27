const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Eingeloggt als ${client.user.tag}`);
});

// Nutzt den Token aus deiner lokalen .env Datei
client.login(process.env.DISCORD_TOKEN);
