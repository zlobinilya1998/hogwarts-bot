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

    static async getEncounters(){
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
                const {rows} = await client.query(`SELECT * FROM encounters WHERE date = '${encounter.date}' and title = '${encounter.title}' and guild = '${encounter.guild}'`);
                const isInDb = !!rows.length;
                if (isInDb) continue
                console.log("Add new encounter to db", encounter);
                await client.query(
                    `INSERT INTO encounters(title,date,link,guild) VALUES('${encounter.title}','${encounter.date}','${encounter.link}', '${encounter.guild}')`
                );
                if (!this.iteration) continue;
                if (!allowedGuildNames.includes(encounter.guild)) continue

                console.log('Отправка сообщения в дискорд для', encounter)
                const lootText = await getLoot(encounter.link);
                const recountText = await getRecount(encounter.link);
                const healText = await getHeal(encounter.link)
                const message = `\n Гильдия **${encounter.guild}** убила [${encounter.title}](<${encounter.link}>) \n ${lootText} \n ${recountText} \n ${healText}`
                await DiscordBotService.send(message);
            }
            await browser.close();
            console.log("Итерация", this.iteration);
            this.iteration += 1;
        } catch (e) {
            console.log(e);
        } finally {
            await new Promise((res) => setTimeout(res, 5_000));
            this.getEncounters();
        }
    }

    static async getLoot(link){
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

    static async getRecount(link){
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

    static async getHeal(link){
        const browser = await puppeteer.launch(this.puppeteerOptions);
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
}

module.exports = {
    ScrapperService
}