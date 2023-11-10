const puppeteer = require("puppeteer");
const { DiscordBotService } = require("./DiscordBotService");
const { EncounterFacade } = require("../facade/EncounterFacade");
const { EncounterRepository } = require("../repository/EncounterRepository");
const { log } = require("nodemon/lib/utils");

const getPuppeeterOptions = () => {
    const isDev = process.env.DB_PORT;
    const options = {
        dev: {},
        prod: {
            headless: true,
            executablePath: "/usr/bin/chromium-browser",
            args: ["--no-sandbox", "--disable-gpu"],
        },
    };
    return isDev ? options.dev : options.prod;
};

getPuppeeterOptions();

class ScrapperService {
    static iteration = 0;
    static puppeteerOptions = getPuppeeterOptions();
    static pages = {
        recentLogs: "https://logs.stormforge.gg/recentlogs/netherwing",
        character: (name) => `https://logs.stormforge.gg/character/netherwing/${name}`,
    };

    static async getEncounters() {
        try {
            const browser = await puppeteer.launch(this.puppeteerOptions);
            const page = await browser.newPage();

            const allowedGuildNames = ["HOGWARTS LEGACY"];

            await page.goto(this.pages.recentLogs);
            await page.setViewport({ width: 1800, height: 1200 });
            await page.waitForSelector(".list-group a");

            const encounters = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll(".list-group-item")).map(
                    (item) => {
                        const link = item.querySelector("a").href;
                        const title = item.querySelector("h6").innerText;
                        const guild = item.querySelector("h5").innerText;
                        const date = item.querySelector("span").innerText;
                        return {
                            link,
                            title: title.replaceAll("'", "''"),
                            guild,
                            date: new Date(date).toLocaleDateString(),
                        };
                    }
                );
                return items.reverse();
            });

            for await (const encounter of encounters) {
                if (!allowedGuildNames.includes(encounter.guild)) continue;
                const isEncounterInDb = await EncounterRepository.getByLink(encounter.link);
                if (isEncounterInDb) continue;
                await EncounterFacade.create(encounter);
                const message = await this.getEncounterMessage(encounter);
                await DiscordBotService.send(message);
            }
            await browser.close();
            console.log(`Iteration: ${this.iteration} complete, next iteration after 30 sec`);
            this.iteration += 1;
        } catch (e) {
            console.log(e);
        } finally {
            await new Promise((res) => setTimeout(res, 30_000));
            this.getEncounters();
        }
    }

    static async getEncounterMessage(encounter) {
        const lootText = await this.getLoot(encounter.link);
        const recountText = await this.getRecount(encounter.link);
        const healText = await this.getHeal(encounter.link);
        return `Гильдия **${encounter.guild}** убила [${encounter.title}](<${encounter.link}>) \n ${lootText} \n ${recountText} \n ${healText}`;
    }

    static async getLoot(link) {
        const browser = await puppeteer.launch(this.puppeteerOptions);
        const page = await browser.newPage();
        await page.goto(link);
        await page.waitForSelector(".raid-loot");
        let loot = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".raid-loot .choices__item")).map(
                (item) => ({
                    title: item.innerText,
                    link: item.href,
                })
            );
        });
        loot = loot.map((item) => `- [${item.title}](<${item.link}>)`);
        await browser.close();
        return `\n**Лут**: \n${loot.join("\n")}`;
    }

    static async getRecount(link) {
        const browser = await puppeteer.launch(this.puppeteerOptions);
        const page = await browser.newPage();
        await page.goto(link);
        await page.waitForSelector(".simple-log");

        let result = await page.evaluate(() => {
            let rows = Array.from(document.querySelectorAll(".simple-log .dmg-meter")).map((row) =>
                row.innerText.replaceAll("\n", " ").split(" ")
            );
            return rows.map((item, index) => {
                const getDps = (item) => {
                    const regex = /\((\d+(?:[,.]\d+)?)\)/;
                    let match = regex.exec(item)[1];
                    match = match.replace(",", "");
                    const toNumber = +match;
                    if (isNaN(toNumber)) return 0;
                    return toNumber;
                };
                return {
                    position: index + 1,
                    name: item[1],
                    total: item[2],
                    dps: getDps(item),
                };
            });
        });

        const totalRaidDps = result.reduce((acc, curValue) => acc + curValue.dps, 0);
        result = result
            .filter((item) => item.dps > 500)
            .map((item) => `${item.position}. ${item.name} *${item.total}* **(${item.dps})**`);

        await browser.close();
        return `\n**Дпс рейда** - **${totalRaidDps}**\n${result.join("\n")}`;
    }

    static async getHeal(link) {
        const browser = await puppeteer.launch(this.puppeteerOptions);
        const page = await browser.newPage();
        await page.goto(link);
        await page.waitForSelector(".simple-log");
        await new Promise((res) => setTimeout(res, 10_000));
        await page.click("input#healer-mode");
        await new Promise((res) => setTimeout(res, 20_000));

        let result = await page.evaluate(() => {
            let rows = Array.from(document.querySelectorAll(".simple-log .dmg-meter")).map((row) =>
                row.innerText.replaceAll("\n", " ").split(" ")
            );
            return rows.map((item, index) => {
                const getHps = (item) => {
                    const regex = /\((\d+(?:[,.]\d+)?)\)/;
                    let match = regex.exec(item)[1];
                    match = match.replace(",", "");
                    const toNumber = +match;
                    if (isNaN(toNumber)) return 0;
                    return toNumber;
                };
                return {
                    position: index + 1,
                    name: item[1],
                    total: item[2],
                    hps: getHps(item),
                };
            });
        });
        const totalRaidHps = result.reduce((acc, curValue) => acc + curValue.hps, 0);
        result = result
            .filter((item) => item.hps > 300)
            .map((item) => `${item.position}. ${item.name} *${item.total}* **(${item.hps})**`);
        await browser.close();
        return `\n**Хпс рейда** - **${totalRaidHps}**\n${result.join("\n")}`;
    }

    static async getCharacterInfo(name) {
        const browser = await puppeteer.launch(this.puppeteerOptions);
        const page = await browser.newPage();
        await page.goto(this.pages.character(name));
        await page.waitForSelector(".character-stats");

        const info = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".character-stats.row")).map(
                (item, index) => {
                    return item.innerText.replaceAll("\n", " ").replaceAll("\t", "");
                }
            );
        });

        const mappedInfo = info.map((text, index) => {
            const getRowName = (index) => {
                const map = new Map([
                    [0, "Общие"],
                    [1, "Характеристики"],
                    [2, "Профессии"],
                ]);
                return map.get(index);
            };
            return `${getRowName(index)}: ${text}`;
        });

        console.log(mappedInfo);
        await browser.close();
        return `\nПерсонаж: **${name}** \n${mappedInfo.join("\n")}`;
    }
}

module.exports = {
    ScrapperService,
};
