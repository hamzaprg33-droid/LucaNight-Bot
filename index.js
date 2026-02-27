const { Client, GatewayIntentBits } = require('discord.js');
const Dashboard = require("discord-dashboard");
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- DAS RICHTIGE DASHBOARD ---
const DBD = new Dashboard.Dash(client, {
    port: 8080,
    client: {
        id: process.env.CLIENT_ID,
        secret: process.env.CLIENT_SECRET 
    },
    redirectUri: "http://localhost:8080/callback",
    domain: "http://localhost",
    ownerIDs: ["DEINE_DISCORD_ID"], 
    theme: Dashboard.Themes.Dark, // Das dunkle "Pro"-Design
    settings: [
        {
            categoryId: 'setup',
            categoryName: "Setup",
            categoryDescription: "Bot-Einstellungen",
            getOptions: async () => {
                return [
                    {
                        optionId: 'prefix',
                        optionName: "Bot Prefix",
                        optionDescription: "Stelle den Prefix ein",
                        optionType: Dashboard.OptionTypes.TEXT,
                        default: "!"
                    }
                ];
            }
        }
    ]
});

// Dashboard starten
DBD.init();

client.once('ready', () => {
    console.log(`✅ Bot & Dashboard laufen auf http://localhost:8080`);
});

client.login(process.env.DISCORD_TOKEN);
