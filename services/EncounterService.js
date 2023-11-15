const {EncounterRepository} = require("../repository/EncounterRepository");
const {ItemService} = require("./ItemService");

class EncounterService {
    static async getAll() {
        let encounters = await EncounterRepository.getAll();

        const result = []
        for await (const item of encounters){
            const encounterItems = await ItemService.getAllByEncounterId(item.id)
            result.push({...item, items: encounterItems})
        }
        return result
    }

    static async create(encounter) {
        const {title, date, link, guild} = encounter
        return await EncounterRepository.insertOne(title,date,link,guild)
    }
}

module.exports = {
    EncounterService
}
