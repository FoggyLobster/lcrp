require("dotenv").config();

function getPlayers(client) {
  const options = {
    method: "GET",
    headers: { "server-key": process.env.API_KEY },
  };

  fetch("https://api.erlc.gg/v1/server/players", options)
    .then((res) => res.json())
    .then((res) => console.log(res))
    .catch((err) => console.error(err));
}

function getTotalPlayers(client) {
  // Use "getPlayers" to get the total amount of players in the server

  const options = {
    method: "GET",
    headers: { "server-key": process.env.API_KEY },
  };

  fetch("https://api.erlc.gg/v1/server/players", options)
    .then((res) => res.json())
    .then((res) => console.log(res.total))
    .catch((err) => console.error(err));
}

module.exports = {
  getPlayers,
  getTotalPlayers,
};
