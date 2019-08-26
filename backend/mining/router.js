const express = require('express');
const router = express.Router();
const miningApi = require('./master');

router.get('/start', (req, res) => {
    miningApi.lastProof()
        .then(lambdaRes => {
            res.status(200).send(lambdaRes);
        })
        .catch(err => {
            res.status(500).send(err);
        });
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