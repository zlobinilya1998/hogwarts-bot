const {client} = require("../db");

class EncounterRepository {
    static async insertOne(title,date,link,guildGuid){
        const query = `INSERT INTO encounter(title,date,link,guild_id) VALUES($1,$2,$3,$4) RETURNING *`
        const {rows} = await client.query(query,[title,date,link,guildGuid]);
        console.log(`Add new encounter into db: ${title} - ${date}`);
        return rows[0]
    }

    static async getByLink(link){
        const query = `SELECT * FROM encounter WHERE link = $1`
        const {rows} = await client.query(query,[link]);
        return rows[0];
    }

    static async getAll(){
        const query = "SELECT title,date,link,name FROM encounter JOIN guild ON encounter.guild_id = guild.id ORDER BY link"
        const {rows} = await client.query(query)
        return rows
    }
}
module.exports = {
    EncounterRepository
}
