const Client = require("pg").Client;

const client = new Client({
    host: "localhost",
    port: 6667,
    user: "postgres",
    password: "postgres",
    database: "db",
});


module.exports = {
    client
}