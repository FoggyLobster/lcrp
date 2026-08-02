require("dotenv").config();

function getQueue(client) {
  const options = {
    method: "GET",
    headers: { "server-key": process.env.API_KEY },
  };

  fetch("https://api.erlc.gg/v1/server/queue", options)
    .then((res) => res.json())
    .then((res) => console.log(res))
    .catch((err) => console.error(err));
}

module.exports = {
  getQueue,
};
