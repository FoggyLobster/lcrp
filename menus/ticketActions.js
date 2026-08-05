const {
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  LabelBuilder,
} = require("discord.js");
const db = require("../db");
const { generateTranscript } = require("../utils/tickets/generateTranscript");

module.exports = {
  customId: "ticket_actions",

  async execute(interaction) {
    const selected = interaction.values[0];

    if (selected === "claim_ticket") {
      const ticket = db
        .prepare(
          `
                SELECT *
                FROM tickets
                WHERE channel_id = ?
                `,
        )
        .get(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "This is not a ticket channel.",
          ephemeral: true,
        });
      }

      const alreadyClaimed = db
        .prepare(
          `
                SELECT claimed_by
                FROM tickets
                WHERE channel_id = ?
                `,
        )
        .get(interaction.channel.id);

      if (alreadyClaimed) {
        return interaction.reply({
          content: "This ticket has already been claimed.",
          ephemeral: true,
        });
      }

      db.prepare(
        `
                UPDATE tickets
                SET claimed_by = ?
                WHERE channel_id = ?
                `,
      ).run(interaction.user.id, interaction.channel.id);

      const ticketOwner = await interaction.guild.members.fetch(ticket.user_id);

      // if the ticket was claimed by the owner, don't let them actually claim it and say "You can't claim your own ticket!"

      if (interaction.user.id === ticketOwner.id) {
        return interaction.reply({
          content: "You can't claim your own ticket!",
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `Ticket has been claimed by <@${interaction.user.id}>.`,
      });
    }

    if (selected === "unclaim_ticket") {
      const ticket = db
        .prepare(
          `
        SELECT * 
        FROM tickets
        WHERE channel_id = ?
        `,
        )
        .run(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "This is not a ticket channel.",
          ephemeral: true,
        });
      }

      if (interaction.user.id !== ticket.claimed_by) {
        return interaction.reply({
          content: "You can't unclaim a ticket that isn't yours.",
          ephemeral: true,
        });
      }

      const notClaimed = db
        .prepare(
          `
        SELECT claimed_by
        FROM tickets
        WHERE channel_id = ?
        `,
        )
        .get(interaction.channel.id);

      if (!notClaimed) {
        return interaction.reply({
          content: "This ticket has not been claimed.",
          ephemeral: true,
        });
      }

      db.prepare(
        `
        UPDATE tickets
        SET claimed_by = NULL
        WHERE channel_id = ?
        `,
      ).run(interaction.channel.id);

      return interaction.reply({
        content: `Ticket has been unclaimed by <@${interaction.user.id}>. Staff can now talk freely along the ticket type and reason for opening.`,
      });
    }

    if (selected === "close_ticket") {
      const ticket = db
        .prepare(
          `
        SELECT * 
        FROM tickets
        WHERE channel_id = ?
        `,
        )
        .run(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "This is not a ticket channel.",
          ephemeral: true,
        });
      }

      const ticketOwnerId = ticket.user_id;
      const ticketOwner = await interaction.guild.members.fetch(ticketOwnerId);

      await ticketOwner.send({
        flags: 32768,
        components: [
          {
            type: 17,
            components: [
              {
                type: 12,
                items: [
                  {
                    media: {
                      url: "https://cdn.discordapp.com/attachments/1529315074991325215/1530981508423090206/assistance1.png?ex=6a736aa3&is=6a721923&hm=40bd31fa8fc4b0ecbbdb53b243663a091a81c023d8a2176510a7d352722457f2&",
                    },
                  },
                ],
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 10,
                content:
                  "Your ticket in **Lakeshore Roleplay** was closed. If you have any more questions, do not hesitate to reach out to one of our staff members or open another ticket! If you need your tickets transcript, please reach out to a management member.\n\n*Best regards,*\n**<:lakeshore:1530640507577831676> Lakeshore Support Team**",
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 12,
                items: [
                  {
                    media: {
                      url: "https://media.discordapp.net/attachments/1529315074991325215/1530981511183208579/underbanner.png?ex=6a721924&is=6a70c7a4&hm=c20d7105e649a4826a7cb423cee57aae9b6c1a57a1ad7cb806eba5295541d0ad&=&format=webp&quality=lossless&width=640&height=63",
                    },
                  },
                ],
              },
            ],
          },
        ],
      });

      db.prepare(
        `
        DELETE FROM tickets
        WHERE channel_id = ?

        `,
      ).run(interaction.channel.id);

      return;
    }

    if (selected === "rename_ticket") {
      const ticket = db
        .prepare(
          `
        SELECT * 
        FROM tickets
        WHERE channel_id = ?
        `,
        )
        .run(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "This is not a ticket channel.",
          ephemeral: true,
        });
      }

      const modal = new ModalBuilder()
        .setTitle("Rename Ticket")
        .setCustomId("rename_ticket_modal")
        .addComponents([
          new TextInputBuilder()
            .setCustomId("rename_ticket_name")
            .setStyle(TextInputStyle.Short)
            .setLabel("New Ticket Name")
            .setRequired(true),
        ]);

      await interaction.showModal(modal);
    }

    if (selected === "transcript") {
      const ticket = db
        .prepare(
          `
        SELECT * 
        FROM tickets
        WHERE channel_id = ?
        `,
        )
        .run(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "This is not a ticket channel.",
          ephemeral: true,
        });
      }

      const file = generateTranscript(ticket);

      const channel = await interaction.guild.channels.fetch(
        "1534363129105088682",
      );

      await channel.send({
        flags: 32768,
        components: [
          {
            type: 17,
            components: [
              {
                type: 10,
                content: "# <:ticket:1531795102425550982> Ticket Closed\n",
              },
              {
                type: 14,
                spacing: 1,
                divider: false,
              },
              {
                type: 10,
                content:
                  "A ticket has been closed by <@${interaction.user.id}>. More information can be found below.\n\n## <:scroll:1529617603327430898> Ticket Information\n\n**<:person:1533692234023833666> Ticket Owner:** <@${ticket.user_id}>\n**<:ticket:1531795102425550982> Ticket Type:** ${ticket.ticket_type}\n**<:transcript:1533692391356235847> Ticket Transcript:**",
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 13,
                file: {
                  url: file,
                },
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 12,
                items: [
                  {
                    media: {
                      url: "https://cdn.discordapp.com/attachments/1529315074991325215/1530981511183208579/underbanner.png?ex=6a736aa4&is=6a721924&hm=e60b6b50045836a6d6443c87864ec09792ae82a4c3aae9ab33e91ff800b3815b&",
                    },
                  },
                ],
              },
            ],
          },
        ],
      });
    }

    if (selected === "add_user") {
      const ticket = db
        .prepare(
          `
        SELECT * 
        FROM tickets
        WHERE channel_id = ?
        `,
        )
        .run(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "This is not a ticket channel.",
          ephemeral: true,
        });
      }

      const modal = new ModalBuilder()
        .setTitle("Add User")
        .setCustomId("add_user_modal")
        .addComponents(
          new LabelBuilder()
            .setLabel("User")
            .setDescription("Select a user to add to the ticket.")
            .addComponents(
              new UserSelectMenuBuilder()
                .setCustomId("add_user_select")
                .setPlaceholder("Select a user")
                .setMinValues(1)
                .setMaxValues(1)
                .setDisabled(false),
            ),
        );

      await interaction.showModal(modal);
    }

    if (selected === "remove_user") {
      const ticket = db
        .prepare(
          `
        SELECT * 
        FROM tickets
        WHERE channel_id = ?
        `,
        )
        .run(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "This is not a ticket channel.",
          ephemeral: true,
        });
      }

      const modal = new ModalBuilder()
        .setTitle("Remove User")
        .setCustomId("remove_user_modal")
        .addComponents(
          new LabelBuilder()
            .setLabel("User")
            .setDescription("Select a user to remove from the ticket.")
            .addComponents(
              new UserSelectMenuBuilder()
                .setCustomId("remove_user_select")
                .setPlaceholder("Select a user")
                .setMinValues(1)
                .setMaxValues(1)
                .setDisabled(false),
            ),
        );

      await interaction.showModal(modal);
    }
  },
};
