const express = require('express');
const router = express.Router();
const miningApi = require('../apis/mining');

router.get('/start', (req, res) => {
    miningApi.startMining();
    res.status(200).send({message: "Mining Started"});
});

router.get('/stop', (req, res) => {
    miningApi.stopMining();
    res.status(200).send({message: "Mining Stopped"});
});

router.get('/balance', (req, res) => {
    miningApi.getBalance()
        .then(lambdaRes => {
            res.status(200).send(lambdaRes);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

module.exports = router;