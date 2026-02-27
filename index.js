const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- DASHBOARD SEKTION ---
const app = express();
const port = 8080; // Dein Dashboard läuft auf http://localhost:8080

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>LucaNight Dashboard</title></head>
            <body style="font-family: Arial; background: #2c2f33; color: white; text-align: center; padding: 50px;">
                <h1>LucaNight Bot Dashboard</h1>
                <p>Status: <span style="color: #43b581;">Online ✅</span></p>
                <p>Eingeloggt als: <strong>${client.user ? client.user.tag : "Lädt..."}</strong></p>
                <p>Server: ${client.guilds.cache.size}</p>
                <hr style="border: 1px solid #7289da; width: 50%;">
                <button onclick="alert('Funktion folgt!')" style="padding: 10px 20px; background: #7289da; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Einstellungen laden
                </button>
            </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`✅ Dashboard aktiv auf http://localhost:${port}`);
});

// --- BOT LOGIK ---
client.once('ready', () => {
    console.log(`🤖 Bot ist online: ${client.user.tag}`);
});

// Start mit dem Token aus deiner lokalen .env
client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error("❌ Login fehlgeschlagen! Prüfe deinen Token in der .env");
});
