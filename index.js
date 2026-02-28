const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const Dashboard = require("discord-dashboard");
const { createTranscript } = require("discord-html-transcripts");
require("dotenv").config();

/* =======================
   CLIENT
======================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const SUPPORT_ROLE_ID = "SUPPORT_ROLLE_ID";
const VERIFIED_ROLE_ID = "VERIFIED_ROLLE_ID";

/* =======================
   DASHBOARD
======================= */

const DBD = new Dashboard.Dash(client, {
  port: 8080,
  client: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  redirectUri: "http://localhost:8080/callback",
  domain: "http://localhost",
  ownerIDs: ["DEINE_DISCORD_ID"],
  settings: [
    {
      categoryId: "setup",
      categoryName: "Setup",
      categoryDescription: "Bot-Einstellungen",
      getOptions: async () => [
        {
          optionId: "prefix",
          optionName: "Bot Prefix",
          optionDescription: "Stelle den Prefix ein",
          optionType: Dashboard.OptionTypes.TEXT,
          default: "!",
        },
      ],
    },
  ],
});

DBD.init();

/* =======================
   READY
======================= */

client.once("ready", () => {
  console.log(
    `✅ Bot & Dashboard laufen auf http://localhost:8080`
  );
});

/* =======================
   MESSAGE COMMANDS
======================= */

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!panel") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket System")
      .setDescription("Wähle eine Kategorie")
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("general")
        .setLabel("❓ Support")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("apply")
        .setLabel("👥 Bewerbung")
        .setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }

  if (message.content === "!tos") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("accept_rules")
        .setLabel("✅ Regeln akzeptieren")
        .setStyle(ButtonStyle.Success)
    );

    message.channel.send({
      content: "📜 Akzeptiere Regeln & Discord TOS",
      components: [row],
    });
  }

  if (message.content.startsWith("!add")) {
    if (!message.member.roles.cache.has(SUPPORT_ROLE_ID))
      return message.reply("❌ Nur Support!");

    const user = message.mentions.users.first();
    if (!user) return message.reply("User markieren!");

    await message.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
    });

    message.reply(`✅ ${user} hinzugefügt.`);
  }

  if (message.content.startsWith("!remove")) {
    if (!message.member.roles.cache.has(SUPPORT_ROLE_ID))
      return message.reply("❌ Nur Support!");

    const user = message.mentions.users.first();
    if (!user) return message.reply("User markieren!");

    await message.channel.permissionOverwrites.delete(user.id);
    message.reply(`❌ ${user} entfernt.`);
  }
});

/* =======================
   INTERACTIONS
======================= */

client.on("interactionCreate", async (interaction) => {

  // TOS
  if (interaction.isButton() && interaction.customId === "accept_rules") {
    await interaction.member.roles.add(VERIFIED_ROLE_ID);
    return interaction.reply({ content: "✅ Verifiziert!", ephemeral: true });
  }

  // Ticket
  if (interaction.isButton() && interaction.customId === "general") {
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: SUPPORT_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ],
    });

    const controls = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("claim").setLabel("Übernehmen").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("unclaim").setLabel("Freigeben").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("close").setLabel("Schließen").setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `Hallo ${interaction.user}\n\n*made by lucanight*`,
      components: [controls],
    });

    return interaction.reply({ content: "✅ Ticket erstellt!", ephemeral: true });
  }

  // Bewerbung Modal
  if (interaction.isButton() && interaction.customId === "apply") {

    if (!interaction.member.roles.cache.has(VERIFIED_ROLE_ID))
      return interaction.reply({ content: "❌ Erst !tos akzeptieren", ephemeral: true });

    const modal = new ModalBuilder()
      .setCustomId("apply_modal")
      .setTitle("Team Bewerbung");

    const why = new TextInputBuilder()
      .setCustomId("why")
      .setLabel("Warum willst du ins Team?")
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(new ActionRowBuilder().addComponents(why));

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "apply_modal") {
    const why = interaction.fields.getTextInputValue("why");

    const channel = await interaction.guild.channels.create({
      name: `bewerbung-${interaction.user.username}`,
      type: ChannelType.GuildText,
    });

    await channel.send(`📋 Bewerbung von ${interaction.user}\n\n${why}\n\n*made by lucanight*`);

    return interaction.reply({ content: "✅ Bewerbung gesendet!", ephemeral: true });
  }

  // Claim
  if (interaction.isButton() && interaction.customId === "claim") {
    await interaction.channel.setName(`🔒-${interaction.channel.name}`);
    return interaction.reply("✅ Übernommen.");
  }

  // Unclaim
  if (interaction.isButton() && interaction.customId === "unclaim") {
    await interaction.channel.setName(interaction.channel.name.replace("🔒-", ""));
    return interaction.reply("🔓 Freigegeben.");
  }

  // Close + Transcript
  if (interaction.isButton() && interaction.customId === "close") {
    const transcript = await createTranscript(interaction.channel);
    await interaction.channel.send({ files: [transcript] });
    setTimeout(() => interaction.channel.delete(), 5000);
  }
});

client.login(process.env.DISCORD_TOKEN);
