const {
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  UserSelectMenuBuilder,
  FileInputBuilder,
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
  customId: "support",

  async execute(interaction) {
    const selected = interaction.values[0];

    if (selected === "support") {
      await interaction.reply({
        flags: 32768,
        components: [
          {
            type: 17,
            components: [
              {
                type: 10,
                content:
                  "## <:scroll:1529617603327430898> Select from the support ticket types below",
              },
              {
                type: 14,
              },
              {
                type: 1,
                components: [
                  {
                    type: 3,
                    options: [
                      {
                        label: "General Support",
                        value: "general_support",
                      },
                      {
                        label: "Internal Affairs",
                        value: "ia_support",
                      },
                      {
                        label: "High Ranking Support",
                        value: "hr_support",
                      },
                    ],
                    placeholder: "Support ticket type",
                    flows: {},
                    custom_id: "support_menu",
                    min_values: 1,
                    max_values: 1,
                  },
                ],
              },
            ],
          },
        ],
      });
    }

    if (selected === "report") {
      const userSelect = new UserSelectMenuBuilder()
        .setCustomId("report_user")
        .setPlaceholder("Who are you reporting?")
        .setMinValues(1)
        .setMaxValues(1)
        .setDisabled(false);

      const userLabel = new LabelBuilder()
        .setCustomId("report_user_label")
        .setLabel("User")
        .setUserSelectMenuComponent(userSelect)
        .setRequired(true);

      const reason = new TextInputBuilder()
        .setCustomId("report_reason")
        .setStyle(TextInputStyle.Short)
        .setLabel("Reason")
        .setRequired(true);

      const evidence = new FileInputBuilder()
        .setCustomId("report_evidence")
        .setLabel("Evidence")
        .setRequired(true);

      const modal = new ModalBuilder()
        .setTitle("Report")
        .setCustomId("report_modal")
        .addComponents([userLabel, reason, evidence]);

      await interaction.showModal(modal);
    }

    if (selected === "reward_claim") {
      await interaction.deferReply({ ephemeral: true });

      const user = interaction.user;
      const userId = user.id;

      const ticketId = genTicketId();

      const type = "reward";

      const existingTicket = db
        .prepare(`SELECT * FROM tickets WHERE user_id = ? AND ticket_type = ?`)
        .get(userId, type);

      if (existingTicket) {
        return interaction.editReply({
          content: "You already have a ticket open.",
          ephemeral: true,
        });
      }

      const ticketChannel = await interaction.guild.channels.create({
        name: `${type}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: interaction.guild.channels.cache.find(
          (channel) => channel.id === "1530788359528648744",
        ),
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            ...support_role_ids.map((role_id) => ({
              id: role_id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ViewMessageHistory,
              ],
            })),
          },
          {
            id: interaction.guild.members.me.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewMessageHistory,
            ],
          },
        ],
      });

      db.prepare(
        `
        INSERT INTO tickets (id, user_id, channel_id, ticket_type, created_at)
        VALUES (?, ?, ?, ?, ?)
        `,
      ).run(ticketId, userId, ticketChannel.id, type, Date.now());

      await interaction.editReply(
        `Ticket can be seen here: <#${ticketChannel.id}>`,
      );

      try {
        await ticketChannel.send({
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
                        url: "https://media.discordapp.net/attachments/1529315074991325215/1530981508423090206/assistance1.png?ex=6a721923&is=6a70c7a3&hm=f599668344afac76e42ff211ee3e1b6bd2dcb2ec9d40714b55a02034fc11b189&=&format=webp&quality=lossless&width=640&height=218",
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
                  content: `# <:page1:1532076108357566585> ${type}\n`,
                },
                {
                  type: 10,
                  content: `⠀ \n@here | <@${interaction.user.id}>\n\nHello <@${interaction.user.id}>! Please allow up to about 24 hours before pinging a staff member. Please remain respectful to our support staff and do not disrespect anyone. If you do disrespect someone of our support you will be moderated accordingly. Some information for our staff,\n\n**Ticket Owner:** <@${interaction.user.id}>\n**Ticket Type:** ${type}\n**Reason for opening:** \`\`\`Reward Claim\`\`\`\n-# Be respectful or your ticket may be closed and you may be moderated. Thank you!`,
                },
                {
                  type: 14,
                  spacing: 2,
                },
                {
                  type: 1,
                  components: [
                    {
                      type: 3,
                      options: [],
                      custom_id: "ticket_actions",
                      min_values: 1,
                      max_values: 1,
                      options: [
                        {
                          label: "Claim Ticket",
                          value: "claim_ticket",
                          emoji: {
                            id: "1533692650228678786",
                            name: "lock",
                            animated: false,
                          },
                        },
                        {
                          label: "Close Ticket",
                          value: "close_ticket",
                          emoji: {
                            id: "1533693011345674271",
                            name: "danger",
                            animated: false,
                          },
                        },
                        {
                          label: "Unclaim Ticket",
                          value: "unclaim_ticket",
                          emoji: {
                            id: "1533692795154464909",
                            name: "unlock",
                            animated: false,
                          },
                        },
                        {
                          label: "Rename Ticket",
                          value: "rename_ticket",
                          emoji: {
                            id: "1533691921166499971",
                            name: "pen",
                            animated: false,
                          },
                        },
                        {
                          label: "Transcript",
                          value: "transcript",
                          emoji: {
                            id: "1533692391356235847",
                            name: "transcript",
                            animated: false,
                          },
                        },
                        {
                          label: "Add User",
                          value: "add_user",
                          emoji: {
                            id: "1533692085843005471",
                            name: "add_user",
                            animated: false,
                          },
                        },
                        {
                          label: "Remove User",
                          value: "remove_user",
                          emoji: {
                            id: "1533693211959103568",
                            name: "remove_user",
                            animated: false,
                          },
                        },
                      ],
                    },
                  ],
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
      } catch (err) {
        console.error(err);
      }
    }
  },
};
