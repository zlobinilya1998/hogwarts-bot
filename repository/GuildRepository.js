const {client} = require("../db");

class GuildRepository {
    static async insertOne(name) {
        const {rows} = await client.query(`INSERT INTO guild(name) VALUES('${name}') RETURNING id`)
        return rows[0].id
    }

    static async getByName(name) {
        const {rows} = await client.query(`SELECT id FROM guild WHERE name = '${name}'`);
        return rows[0];
    }
}


module.exports = {
    GuildRepository
}
