const Discord = require("discord.js");

const hook = new Discord.WebhookClient(
    process.env.BOT_CHANNEL_ID,
    process.env.BOT_CHANNEL_TOKEN,
);

class DiscordBotService {
    static async send(text){
        console.log('Отправка сообщения в дискорд: \n', text)
        return await hook.send(text)
    }
}

module.exports = {
    DiscordBotService
}
