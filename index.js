require('dotenv').config()
const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const port = 3001;
const bodyParser = require('body-parser')
const Discord = require("discord.js");
const { client} = require("./db")
const { EncounterService } = require("./services/EncounterService");
const hook = new Discord.WebhookClient(
    process.env.BOT_CHANNEL_ID,
    process.env.BOT_CHANNEL_TOKEN,
);



iteration = 0;

app.use(bodyParser.json())

app.get("/encounters",async (req,res) => {
    const encounters = await EncounterService.getAll()
    res.send(encounters)
})

app.post("/encounters", async (req,res) => {
    const encounter = await EncounterService.create(req.body)
    res.send(encounter)
})

async function getEncounters() {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto("https://logs.stormforge.gg/recentlogs/netherwing");
        await page.setViewport({ width: 1800, height: 1200 });
        let encounters = await page.evaluate(() => {
            let encounters = Array.from(document.querySelectorAll(".list-group h6 a")).map(
                (enc) => {
                    return {
                        title: enc.innerText,
                        link: enc.href,
                    };
                }
            );
            let dates = Array.from(document.querySelectorAll(".list-group span")).map(
                (date, index) => {
                    return {
                        title: encounters[index].title.replaceAll("'", "''"),
                        link: encounters[index].link,
                        date: new Date(date.innerText).toLocaleDateString(),
                    };
                }
            );
            return dates;
        });

        const reversedEncounters = encounters.reverse()

        for await (const encounter of reversedEncounters) {
            const { rows } = await client.query(
                `SELECT * FROM encounters WHERE date = '${encounter.date}' and title = '${encounter.title}'`
            );
            const isInDb = !!rows.length;
            if (isInDb) continue
            console.log("Add new enctounter to db");
            await client.query(
                `INSERT INTO encounters(title,date,link) VALUES('${encounter.title}','${encounter.date}','${encounter.link}')`
            );
            if (!iteration) continue;
            const lootText = await getLoot(encounter.link);
            const recountText = await getRecount(encounter.link);
            hook.send(
                `\n [Гильдия убила](<${encounter.link}>) ${encounter.title} \n ${lootText} \n ${recountText}`
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
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(link);
    await page.waitForSelector(".raid-loot");
    let result = await page.evaluate(() => {
        let items = Array.from(document.querySelectorAll(".raid-loot .choices__item"));
        let images = Array.from(document.querySelectorAll(".raid-loot img")).map((img) => img.src);
        console.log(images);
        items = items.map((enc) => {
            return {
                title: enc.innerText,
                link: enc.href,
            };
        });
        return items.map((item, index) => `- [${item.title}](<${images[index]}>)`);
    });
    await browser.close();
    return `\n **Лут**: \n  ${result.join("\n")}`;
};

const getRecount = async (link) => {
    const browser = await puppeteer.launch({ headless: true });
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
