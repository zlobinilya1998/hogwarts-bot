const {client} = require("../db");

class ItemRepository {

    static async insertOne(image,title,link,encounterId){
        const query = `INSERT INTO item(image,title,link,encounter_id) VALUES($1,$2,$3,$4) RETURNING *`
        const {rows} = await client.query(query,[image,title,link,encounterId]);
        console.log(`Add new item into db: ${title} - ${encounterId}`);
        return rows[0]
    }
    static async insertMany(items, encounterId){
        items.forEach(item => this.insertOne(item.img,item.title,item.link,encounterId));
    }
    static async getByEncounterId(encounterId){
        const query = `SELECT title,link,image FROM item WHERE encounter_id = $1`
        const {rows} = await client.query(query,[encounterId]);
        return rows
    }

    static async getAll(){

    }
}
module.exports = {
    ItemRepository
}
