// require('dotenv').config({ path: `.env.development` });
const express = require("express");
const bodyParser = require('body-parser')
const bot = require('./bot')
const app = express();
const port = 3001;
const {client} = require("./db")
const {ScrapperService} = require("./services/ScrapperService");
const {EncounterRouter} = require("./router/EncounterRouter")
const {CharacterRouter} = require("./router/CharacterRouter");
app.use(bodyParser.json())

app.use('/encounters', EncounterRouter)
app.use('/character', CharacterRouter)
app.use((err, req, res, next) => {
    res.status(500).send({
        isSuccess: false,
        error: err.message || 'Something broke!'
    })
})

const start = async () => {
    try {
        await client.connect();
        ScrapperService.getEncounters();
        app.listen(port, () => console.log("App listening...."));
    } catch (e) {
        console.log(e);
    }
};

start();

module.exports = {
    client
}
