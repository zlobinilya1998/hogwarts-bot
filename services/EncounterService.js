const {EncounterRepository} = require("../repository/EncounterRepository");

class EncounterService {
    static async getAll() {
        return await EncounterRepository.getAll();
    }

    static async create(encounter) {
        const {title, date, link, guild} = encounter
        return await EncounterRepository.insertOne(title,date,link,guild)
    }
}

module.exports = {
    EncounterService
}
