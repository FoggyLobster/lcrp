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
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getTotalPlayers() {
  const players = await getPlayers();

  if (!players) return 0;

  return players.total;
}

module.exports = {
  getPlayers,
  getTotalPlayers,
};
