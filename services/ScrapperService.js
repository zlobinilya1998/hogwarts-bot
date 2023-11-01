const puppeteer = require("puppeteer");
const {client} = require("../db");
const {DiscordBotService} = require("./DiscordBotService");

class ScrapperService {
    static iteration = 0;
    static puppeteerOptions = {
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-gpu',
        ]
    }
    // static puppeteerOptions = {}

    static async getEncounters() {
        try {
            const browser = await puppeteer.launch(this.puppeteerOptions);
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
                const {rows} = await client.query(`SELECT * FROM encounter WHERE link = '${encounter.link}'`);
                if (rows.length) continue


                const {rows: guilds} = await client.query(`SELECT id FROM guild WHERE name = '${encounter.guild}'`);

                let guildGuid = null;

                if (guilds.length) {
                    guildGuid = guilds[0].id
                } else {
                    const {rows: newGuild} = await client.query(`INSERT INTO guild(name) VALUES('${encounter.guild}') RETURNING id`)
                    guildGuid = newGuild[0].id
                }
                console.log("Add new encounter to db", encounter);
                await client.query(
                    `INSERT INTO encounter(title,date,link,guild_id) VALUES('${encounter.title}','${encounter.date}','${encounter.link}', '${guildGuid}')`
                );
                if (!this.iteration) continue;
                if (!allowedGuildNames.includes(encounter.guild)) continue

                console.log('Отправка сообщения в дискорд для', encounter)
                const lootText = await this.getLoot(encounter.link);
                const recountText = await this.getRecount(encounter.link);
                const healText = await this.getHeal(encounter.link)
                const message = `\n Гильдия **${encounter.guild}** убила [${encounter.title}](<${encounter.link}>) \n ${lootText} \n ${recountText} \n ${healText}`
                await DiscordBotService.send(message);
            }
            await browser.close();
            console.log("Итерация", this.iteration);
            this.iteration += 1;
        } catch (e) {
            console.log(e);
        } finally {
            await new Promise((res) => setTimeout(res, 30_000));
            this.getEncounters();
        }
    }

    static async getLoot(link) {
        const browser = await puppeteer.launch(this.puppeteerOptions);
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

    static async getRecount(link) {
        const browser = await puppeteer.launch(this.puppeteerOptions);
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

    static async getHeal(link) {
        const browser = await puppeteer.launch(this.puppeteerOptions);
        const page = await browser.newPage();
        await page.goto(link);
        await page.waitForSelector(".simple-log");
        await new Promise(res => setTimeout(res, 4_000))
        await page.click("input#healer-mode")
        await new Promise(res => setTimeout(res, 4_000))

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

    static async getCharacterInfo(name) {
        const browser = await puppeteer.launch(this.puppeteerOptions);
        const page = await browser.newPage();
        await page.goto(`https://logs.stormforge.gg/character/netherwing/${name}`)
        await page.waitForSelector(".character-stats");



        const info = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".character-stats.row")).map((item,index) => {
                return item.innerText.replaceAll("\n", " ").replaceAll("\t", "");
            });
        })

        const mappedInfo = info.map((text,index) => {
            const getRowName = (index) => {
                const map = new Map([
                    [0,"Общие"],
                    [1,"Характеристики"],
                    [2,"Профессии"],
                ])
                return map.get(index)
            }
            return `${getRowName(index)}: ${text}`
        })

        console.log(mappedInfo)
        await browser.close();
        return `\nПерсонаж: **${name}** \n${mappedInfo.join("\n")}`
    }
}

module.exports = {
    ScrapperService
}
