module.exports = {
  name: "interactionCreate",

  async execute(client, interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (cmd) await cmd.execute(interaction);
      }

      if (interaction.isButton()) {
        const btn = client.buttons.get(interaction.customId);
        if (btn) await btn.execute(interaction);
      }

      if (interaction.isStringSelectMenu()) {
        const menu = client.menus.get(interaction.customId);
        if (menu) await menu.execute(interaction);
      }

      if (interaction.isModalSubmit()) {
        const modal = client.modals.get(interaction.customId);
        if (modal) await modal.execute(interaction);
      }
    } catch (err) {
      console.error(err);
      if (!interaction.replied) {
        interaction.reply({ content: "Error occurred.", ephemeral: true });
      }
    }
  },
};
