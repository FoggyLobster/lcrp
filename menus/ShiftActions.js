const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
} = require("discord.js");

const db = require("../db");

module.exports = {
  customId: "shift_user_actions",
  async execute(interaction) {
    const user = db.prepare;
  },
};
