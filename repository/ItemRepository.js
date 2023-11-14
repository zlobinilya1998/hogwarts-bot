const {client} = require("../db");

class ItemRepository {

    static async insertOne(title,link,encounterId){
        const query = `INSERT INTO item(title,link,encounter_id) VALUES($1,$2,$3) RETURNING *`
        const {rows} = await client.query(query,[title,link,encounterId]);
        console.log(`Add new item into db: ${title} - ${encounterId}`);
        return rows[0]
    }
    static async insertMany(items, encounterId){
        items.forEach(item => this.insertOne(item.title,item.link,encounterId));
    }
}
module.exports = {
    ItemRepository
}
