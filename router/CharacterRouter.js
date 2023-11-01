const express = require('express');
const {ScrapperService} = require("../services/ScrapperService");
const {DiscordBotService} = require("../services/DiscordBotService");
const CharacterRouter = express.Router();



CharacterRouter.get("/:name", async (req, res, next) => {
    try {
        const name = req.params.name;
        const encounters = await ScrapperService.getCharacterInfo(name);
        DiscordBotService.send(encounters)
        res.send(encounters);
    } catch (e) {
        next(e);
    }
})



module.exports = {
    CharacterRouter
}
