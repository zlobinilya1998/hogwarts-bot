const Discord = require('discord.js');
const {ScrapperService} = require("./services/ScrapperService");
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Bot: logged in Discord as ${client.user.tag}!`);
});

client.on('message', async msg => {

    try {
        if (msg.content.includes('!inspect')) {
            const name = msg.content.split(' ')[1]
            if (!name) return msg.reply("Введите имя персонажа")
            const text = await ScrapperService.getCharacterInfo(name)
            await msg.reply(text);
        }
    } catch (e) {
        await msg.reply("Ошибка")
    }

});

client.login(process.env.BOT_TOKEN);
