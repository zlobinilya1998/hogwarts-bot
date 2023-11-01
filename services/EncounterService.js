class EncounterService {
    static async getAll() {
        const {client} = require('../index')
        const {rows} = await client.query("SELECT title,date,link,name FROM encounter JOIN guild ON encounter.guild_id = guild.id ORDER BY link")
        return rows
    }

    static async create(encounter) {
        const {client} = require('../index')
        const {title, date, link, guild} = encounter
        const query = `INSERT into encounter(title,date,link,guild) VALUES($1,$2,$3,$4) RETURNING *`
        const {rows} = await client.query(query, [title, date, link, guild])
        return rows[0]
    }
}

module.exports = {
    EncounterService
}
