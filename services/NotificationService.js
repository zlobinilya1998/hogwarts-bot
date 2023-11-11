const {NotificationRepository} = require("../repository/NotificationRepository");

class NotificationService {
    static async sendEncounterNotification() {
        const resp = await NotificationRepository.getAll();
    }

}

module.exports = {
    NotificationService
}
