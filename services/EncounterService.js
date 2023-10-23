
class EncounterService {
    static async getAll(){
        const {client} = require('../index')
        const {rows} = await client.query("SELECT * FROM encounters")
        return rows
    }
    static async create(encounter){
        const {client} = require('../index')
        const {title,date,link} = encounter
        const {rows} = await client.query(`INSERT into encounters(title,date,link) VALUES('${title}','${date}','${link}') RETURNING *`)
        return rows[0]
    }
}

module.exports = {
    EncounterService
}