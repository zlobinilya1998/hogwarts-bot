const e = require('express');
const express = require('express')
const bodyParser = require('body-parser').json()
const puppeteer = require('puppeteer');
const app = express()
const port = 3000
const Discord = require('discord.js');
const bot = new Discord.Client();
const hook = new Discord.WebhookClient('1165062221777346731', 'XFjXcgk3qwTErMPinhdAUzhIaphi3nlNySb3XBjNL2sTlJHurf31eWs6flgpTd5gXZC3');
const Client = require('pg').Client
const client = new Client({
    host: 'localhost',
    port: 6666,
    user: 'postgres',
    password:'postgres',
    database: 'db',
})

app.use(bodyParser)


iteration = 0

async function getEncounters() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://logs.stormforge.gg/guild/netherwing/hogwarts-legacy');
    await page.setViewport({width: 1800, height: 1200})
    let encounters = await page.evaluate(() => {
        let encounters = Array.from(document.querySelectorAll('.list-group h6 a')).map(enc => {
            return {
                title: enc.innerText,
                link: enc.href,
            }
        });
        let dates = Array.from(document.querySelectorAll('.list-group span')).map((date,index) => {
            return {
                title: encounters[index].title.replaceAll("'","''"),
                link: encounters[index].link,
                date: new Date(date.innerText).toLocaleDateString()
            }
        })
        return dates
    });


    for await (const encounter of encounters){
        const {rows} = await client.query(`SELECT * FROM encounters WHERE date = '${encounter.date}' and title = '${encounter.title}'`)
        const isInDb = !!rows.length;
    
        if (!isInDb){
            console.log("Add new enctounter to db")
            await client.query(`INSERT INTO encounters(title,date,link) VALUES('${encounter.title}','${encounter.date}','${encounter.link}')`);
            const lootText = await getLoot(encounter.link)
            hook.send(`\n [Гильдия убила](<${encounter.link}>) ${encounter.title}, ${lootText}`)
        }
    }
    await browser.close();
    console.log('Итерация', iteration)
    iteration += 1
    getEncounters();
}

const getLoot = async (link) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link);
    await page.waitForSelector(".raid-loot")
    let result = await page.evaluate(() => {
        let items = Array.from(document.querySelectorAll('.raid-loot .choices__item'));
        console.log(items);
        items = items.map(enc => {
            return {
                title: enc.innerText,
                link: enc.href,
            }
        })
        return items.map(item => `[${item.title}](<${item.link}>)`)
    });
    await browser.close()
    return `\n **Лут**: ${result.join(', ')}`
}

const start = async () => {
try {
    await client.connect()
    await bot.login('MTE2NTA1NDM1ODg0MTQ2Mjc5Nw.GSi3jH.22hIHMkQ-JU307yY1vV4vdO6rGMN-y-GIzcxaw');
    getEncounters();
    app.listen(port, () => console.log('App listening....'))
} catch (e) {
    console.log(e)
}
}

start()
