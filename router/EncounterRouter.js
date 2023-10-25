const express = require('express');
const {EncounterService} = require("../services/EncounterService");
const EncounterRouter = express.Router();


EncounterRouter.get("",)

EncounterRouter.get("/", async (req, res) => {
    const encounters = await EncounterService.getAll()
    res.send(encounters)
})
EncounterRouter.post("/", async (req, res) => {
    const encounter = await EncounterService.create(req.body)
    res.send(encounter)
})


module.exports = {
    EncounterRouter
}
