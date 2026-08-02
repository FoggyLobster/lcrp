require("dotenv").config();

async function getPlayers() {
  const options = {
    method: "GET",
    headers: {
      "server-key": process.env.API_KEY,
    },
  };

  try {
    const res = await fetch("https://api.erlc.gg/v1/server/players", options);

    const data = await res.json();

    console.log(data);

    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getTotalPlayers() {
  const players = await getPlayers();

  console.log("PLAYER RESPONSE:", players);

  if (!players) return 0;

  return players;
}

module.exports = {
  getPlayers,
  getTotalPlayers,
};
