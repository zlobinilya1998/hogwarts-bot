const Discord = require('discord.js'); // Подключаем библиотеку discord.js

// Команды //

function test(robot, mess, args) {
  mess.channel.send('Test!')
}


// Список команд //

var comms_list = [{
  name: "test",
  out: test,
  about: "Тестовая команда"
}];

// Name - название команды, на которую будет реагировать бот
// Out - название функции с командой
// About - описание команды 

module.exports.comms = comms_list;