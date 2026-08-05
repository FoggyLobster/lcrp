const {
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const db = require("../db");

const support_role_ids = [
  "1529308531067719701",
  "1529307189200818308",
  "1530058427794063400",
];

function genTicketId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let ID = [];

  for (let i = 0; i < 5; i++) {
    ID.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }

  return ID.join("");
}

module.exports = {
  customId: "support_menu",

  async execute(interaction) {
    const selected = interaction.values[0];

    if (selected === "general_support") {
      Type = "General Support";
    } else if (selected === "ia_support") {
      Type = "Internal Affairs Support";
    } else {
      Type = "High Ranking Support";
    }
  },
};
