const {ItemRepository} = require("../repository/ItemRepository");

class ItemService {
    static async getAllByEncounterId(encounterId) {
        return await ItemRepository.getByEncounterId(encounterId);
    }

    static async create(encounter) {}
}

module.exports = {
    ItemService
}
