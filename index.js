// require('dotenv').config({ path: `.env.development` });
const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const port = 3001;
const bodyParser = require('body-parser')
const Discord = require("discord.js");
const {client} = require("./db")
const {EncounterService} = require("./services/EncounterService");
const hook = new Discord.WebhookClient(
    process.env.BOT_CHANNEL_ID,
    process.env.BOT_CHANNEL_TOKEN,
);
let puppeteerOptions = {
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: [
        '--no-sandbox',
        '--disable-gpu',
    ]
}

iteration = 0;

app.use(bodyParser.json())

app.get("/encounters", async (req, res) => {
    const encounters = await EncounterService.getAll()
    res.send(encounters)
})

app.post("/encounters", async (req, res) => {
    const encounter = await EncounterService.create(req.body)
    res.send(encounter)
})

async function getEncounters() {
    try {
        const browser = await puppeteer.launch(puppeteerOptions);
        const page = await browser.newPage();

        const allowedGuildNames = ["HOGWARTS LEGACY"]

        await page.goto("https://logs.stormforge.gg/recentlogs/netherwing");
        await page.setViewport({width: 1800, height: 1200});
        await page.waitForSelector(".list-group a");

        const encounters = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.list-group-item')).map(item => {
                const link = item.querySelector("a").href;
                const title = item.querySelector("h6").innerText;
                const guild = item.querySelector("h5").innerText;
                const date = item.querySelector("span").innerText;
                return {
                    link,
                    title: title.replaceAll("'", "''"),
                    guild,
                    date: new Date(date).toLocaleDateString(),
                }
            })
            return items.reverse();
        })

        for await (const encounter of encounters) {
            const {rows} = await client.query(`SELECT * FROM encounters WHERE date = '${encounter.date}' and title = '${encounter.title}' and guild = '${encounter.guild}'`);
            const isInDb = !!rows.length;
            if (isInDb) continue
            console.log("Add new encounter to db", encounter);
            await client.query(
                `INSERT INTO encounters(title,date,link,guild) VALUES('${encounter.title}','${encounter.date}','${encounter.link}', '${encounter.guild}')`
            );
            if (!iteration) continue;
            if (!allowedGuildNames.includes(encounter.guild)) continue

            console.log('Отправка сообщения в дискорд для', encounter)
            const lootText = await getLoot(encounter.link);
            const recountText = await getRecount(encounter.link);
            const healText = await getHeal(encounter.link)
            hook.send(
                `\n Гильдия **${encounter.guild}** убила [${encounter.title}](<${encounter.link}>) \n ${lootText} \n ${recountText} \n ${healText}`
            );
        }
        await browser.close();
        console.log("Итерация", iteration);
        iteration += 1;
    } catch (e) {
        console.log(e);
    } finally {
        await new Promise((res) => setTimeout(res, 5_000));
        getEncounters();
    }
}

const getLoot = async (link) => {
    const browser = await puppeteer.launch(puppeteerOptions);
    const page = await browser.newPage();
    await page.goto(link);
    await page.waitForSelector(".raid-loot");
    let loot = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".raid-loot .choices__item")).map(item => ({
            title: item.innerText,
            link: item.href,
        }));
    })
    loot = loot.map(item => `- [${item.title}](<${item.link}>)`);
    await browser.close();
    return `\n **Лут**: \n  ${loot.join("\n")}`;
};

const getRecount = async (link) => {
    const browser = await puppeteer.launch(puppeteerOptions);
    const page = await browser.newPage();
    await page.goto(link);
    await page.waitForSelector(".simple-log");

    let result = await page.evaluate(() => {
        let rows = Array.from(document.querySelectorAll(".simple-log .dmg-meter")).map((row) =>
            row.innerText.replaceAll("\n", " ").split(" ")
        );
        return rows.map((item, index) => `${index + 1}. ${item[1]} *${item[2]}* **${item[3]}**`);
    });

    let totalRaidDps = 0;
    result.forEach((item) => {
        const regex = /\((\d+(?:[,.]\d+)?)\)/;
        let match = regex.exec(item)[1];
        match = match.replace(",", "");
        const toNumber = +match;
        if (!isNaN(toNumber)) totalRaidDps += toNumber;
    });
    await browser.close();
    return `\n**Дпс рейда** - **${totalRaidDps}**\n${result.join("\n")}`;
};

const getHeal = async (link) => {
    const browser = await puppeteer.launch(puppeteerOptions);
    const page = await browser.newPage();
    await page.goto(link);
    await page.waitForSelector(".simple-log");
    await new Promise(res => setTimeout(res, 1_000))
    await page.click("input#healer-mode")
    await new Promise(res => setTimeout(res, 2_000))

    let result = await page.evaluate(() => {
        let rows = Array.from(document.querySelectorAll(".simple-log .dmg-meter")).map((row) =>
            row.innerText.replaceAll("\n", " ").split(" ")
        );
        return rows.map((item, index) => `${index + 1}. ${item[1]} *${item[2]}* **${item[3]}**`);
    });

    let totalRaidHps = 0
    result.forEach((item) => {
        const regex = /\((\d+(?:[,.]\d+)?)\)/;
        let match = regex.exec(item)[1];
        match = match.replace(",", "");
        const toNumber = +match;
        if (!isNaN(toNumber)) totalRaidHps += toNumber;
    });
    await browser.close();
    return `\n**Хпс рейда** - **${totalRaidHps}**\n${result.join("\n")}`;
};

const start = async () => {
    try {
        await client.connect();
        getEncounters();
        app.listen(port, () => console.log("App listening...."));
    } catch (e) {
        console.log(e);
    }
};

start();

module.exports = {
    client
}
