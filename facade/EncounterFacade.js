const {GuildRepository} = require("../repository/GuildRepository");
const {EncounterRepository} = require("../repository/EncounterRepository");
const {ItemRepository} = require("../repository/ItemRepository");

class EncounterFacade {
    static async create(encounter, items){
        const guild = await GuildRepository.getByName(encounter.guild)
        let guildGuid = null;
        if (guild) guildGuid = guild.id
        else guildGuid = await GuildRepository.insertOne(encounter.guild);
        const { id } = await EncounterRepository.insertOne(encounter.image,encounter.title,encounter.date,encounter.link, guildGuid);
        await ItemRepository.insertMany(items, id);
    }
}
module.exports = {
    EncounterFacade
}
