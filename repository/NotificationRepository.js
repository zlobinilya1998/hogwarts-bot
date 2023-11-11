const {client} = require("../db");

class NotificationRepository {
    static async insertOne(userId){
        const query = `INSERT INTO encounter_notification(user_id) VALUES($1) RETURNING *`
        const {rows} = await client.query(query,[userId]);
        console.log(`Add new user for notification: ${userId}`);
        return rows[0]
    }
    static async getAll(){
        const query = "SELECT * FROM encounter_notification"
        const {rows} = await client.query(query)
        return rows
    }
}
module.exports = {
    NotificationRepository
}
