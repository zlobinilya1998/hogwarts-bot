const express = require('express');
const {EncounterService} = require("../services/EncounterService");
const EncounterRouter = express.Router();


EncounterRouter.get("",)

EncounterRouter.get("/", async (req, res, next) => {
    try {
        const encounters = await EncounterService.getAll()
        res.send(encounters)
    } catch (e) {
        next(e)
    }
})
EncounterRouter.post("/", async (req, res,next) => {
    try {
        const encounter = await EncounterService.create(req.body)
        res.send(encounter)
    } catch (e) {
        next(e)
    }
})


module.exports = {
    EncounterRouter
}
