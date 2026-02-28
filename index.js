const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");

const { createTranscript } = require("discord-html-transcripts");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/* ======= ANPASSEN ======= */
const SUPPORT_ROLE_ID = "SUPPORT_ROLLEN_ID";
const VERIFIED_ROLE_ID = "VERIFIED_ROLLEN_ID";
/* ======================== */

client.once("ready", () => {
  console.log(`✅ Bot ist online als ${client.user.tag}`);
});

/* ========================
   COMMANDS
======================== */

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  /* PANEL */
  if (message.content === "!panel") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket System")
      .setDescription("Wähle eine Kategorie")
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_support")
        .setLabel("❓ Allgemeiner Support")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("ticket_partner")
        .setLabel("🤝 Partnerschaft")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("ticket_apply")
        .setLabel("👥 Team Bewerbung")
        .setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({
      embeds: [embed],
      components: [row],
    });
  }

  /* TOS */
  if (message.content === "!tos") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("accept_rules")
        .setLabel("✅ Regeln & Discord TOS akzeptieren")
        .setStyle(ButtonStyle.Success)
    );

    message.channel.send({
      content:
        "📜 Mit Klick bestätigst du die Server Regeln und die Discord TOS.",
      components: [row],
    });
  }

  /* ADD USER */
  if (message.content.startsWith("!add")) {
    if (!message.member.roles.cache.has(SUPPORT_ROLE_ID))
      return message.reply("❌ Nur Support darf User hinzufügen.");

    const user = message.mentions.users.first();
    if (!user) return message.reply("User markieren!");

    await message.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
    });

    message.reply(`✅ ${user} wurde hinzugefügt.`);
  }

  /* REMOVE USER */
  if (message.content.startsWith("!remove")) {
    if (!message.member.roles.cache.has(SUPPORT_ROLE_ID))
      return message.reply("❌ Nur Support darf User entfernen.");

    const user = message.mentions.users.first();
    if (!user) return message.reply("User markieren!");

    await message.channel.permissionOverwrites.delete(user.id);
    message.reply(`❌ ${user} wurde entfernt.`);
  }
});

/* ========================
   INTERACTIONS
======================== */

client.on("interactionCreate", async (interaction) => {

  /* TOS ACCEPT */
  if (interaction.isButton() && interaction.customId === "accept_rules") {
    await interaction.member.roles.add(VERIFIED_ROLE_ID);
    return interaction.reply({
      content: "✅ Du bist jetzt verifiziert!",
      ephemeral: true,
    });
  }

  /* TICKET CREATE */
  if (
    interaction.isButton() &&
    ["ticket_support", "ticket_partner"].includes(interaction.customId)
  ) {
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
          ],
        },
        {
          id: SUPPORT_ROLE_ID,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
          ],
        },
      ],
    });

    const controls = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("claim_ticket")
        .setLabel("Übernehmen")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("unclaim_ticket")
        .setLabel("Freigeben")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Schließen")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `Hallo ${interaction.user}, bitte beschreibe dein Anliegen.\n\n*made by lucanight*`,
      components: [controls],
    });

    return interaction.reply({
      content: "✅ Ticket wurde erstellt!",
      ephemeral: true,
    });
  }

  /* CLAIM */
  if (interaction.isButton() && interaction.customId === "claim_ticket") {
    if (!interaction.member.roles.cache.has(SUPPORT_ROLE_ID))
      return interaction.reply({ content: "❌ Nur Support!", ephemeral: true });

    await interaction.channel.setName(`🔒-${interaction.channel.name}`);
    return interaction.reply("✅ Ticket übernommen.");
  }

  /* UNCLAIM */
  if (interaction.isButton() && interaction.customId === "unclaim_ticket") {
    if (!interaction.member.roles.cache.has(SUPPORT_ROLE_ID))
      return interaction.reply({ content: "❌ Nur Support!", ephemeral: true });

    await interaction.channel.setName(
      interaction.channel.name.replace("🔒-", "")
    );
    return interaction.reply("🔓 Ticket freigegeben.");
  }

  /* CLOSE + TRANSCRIPT */
  if (interaction.isButton() && interaction.customId === "close_ticket") {
    const transcript = await createTranscript(interaction.channel, {
      limit: -1,
      filename: `${interaction.channel.name}.html`,
    });

    await interaction.channel.send({
      content: "📜 Hier ist das Transcript:",
      files: [transcript],
    });

    setTimeout(() => interaction.channel.delete(), 5000);
  }

  /* BEWERBUNG BUTTON */
  if (interaction.isButton() && interaction.customId === "ticket_apply") {
    if (!interaction.member.roles.cache.has(VERIFIED_ROLE_ID))
      return interaction.reply({
        content: "❌ Du musst zuerst !tos akzeptieren.",
        ephemeral: true,
      });

    const modal = new ModalBuilder()
      .setCustomId("apply_modal")
      .setTitle("Team Bewerbung");

    const why = new TextInputBuilder()
      .setCustomId("why")
      .setLabel("Warum möchtest du ins Team?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(why));

    return interaction.showModal(modal);
  }

  /* MODAL SUBMIT */
  if (interaction.isModalSubmit() && interaction.customId === "apply_modal") {
    const why = interaction.fields.getTextInputValue("why");

    const channel = await interaction.guild.channels.create({
      name: `bewerbung-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: SUPPORT_ROLE_ID,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    await channel.send(
      `📋 Bewerbung von ${interaction.user}\n\n${why}\n\n*made by lucanight*`
    );

    return interaction.reply({
      content: "✅ Bewerbung erfolgreich gesendet!",
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
