module.exports = {
  customId: "create_ticket",

  async execute(interaction) {
    await interaction.reply({
      flags: 32768,
      components: [
        {
          type: 17,
          components: [
            {
              type: 10,
              content:
                "Are you sure that this problem is not stated in the FAQ? They can be seen below:\n\n**Do we accept fastpasses or transfers?**\n-# No we do not accept these\n\n**How do I verify?**\n-# You run `/verify` with Lakeshore Operations",
            },
            {
              type: 14,
              spacing: 2,
            },
            {
              type: 10,
              content: "Still need help? You can select a ticket type below!",
            },
            {
              type: 1,
              components: [
                {
                  type: 3,
                  options: [
                    {
                      label: "Support Ticket",
                      value: "support",
                      emoji: {
                        id: "1531795102425550982",
                        name: "unknown",
                        animated: false,
                      },
                    },
                    {
                      label: "Report Ticket",
                      value: "report",
                      emoji: {
                        id: "1533693011345674271",
                        name: "danger",
                        animated: false,
                      },
                    },
                    {
                      label: "Reward Claim",
                      value: "reward_claim",
                      emoji: {
                        id: "1533983285363998860",
                        name: "confetti",
                        animated: false,
                      },
                    },
                  ],
                  flows: {},
                  custom_id: "support",
                  min_values: 1,
                  max_values: 1,
                  placeholder: "Ticket Types",
                },
              ],
            },
          ],
        },
      ],
    });
  },
};
