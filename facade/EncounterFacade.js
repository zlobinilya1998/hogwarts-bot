const {GuildRepository} = require("../repository/GuildRepository");
const {EncounterRepository} = require("../repository/EncounterRepository");

class EncounterFacade {
    static async create(encounter){
        const isEncounterInDb = await EncounterRepository.getByLink(encounter.link);
        if (isEncounterInDb) return;
        const guild = await GuildRepository.getByName(encounter.guild)
        let guildGuid = null;
        if (guild) guildGuid = guild.id
        else guildGuid = await GuildRepository.insertOne(encounter.guild);
        await EncounterRepository.insertOne(encounter.title,encounter.date,encounter.link, guildGuid);
    }
}
module.exports = {
    EncounterFacade
}
