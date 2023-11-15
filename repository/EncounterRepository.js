const {client} = require("../db");

class EncounterRepository {
    static async insertOne(image,title,date,link,guildGuid){
        const query = `INSERT INTO encounter(image,title,date,link,guild_id) VALUES($1,$2,$3,$4,$5) RETURNING *`
        const {rows} = await client.query(query,[image,title,date,link,guildGuid]);
        console.log(`Add new encounter into db: ${title} - ${date}`);
        return rows[0]
    }

    static async getByLink(link){
        const query = `SELECT * FROM encounter WHERE link = $1`
        const {rows} = await client.query(query,[link]);
        return rows[0];
    }

    static async getAll(){
        const query = "SELECT * FROM encounter ORDER BY id DESC LIMIT 10"
        const {rows} = await client.query(query)
        return rows
    }
}
module.exports = {
    EncounterRepository
}
