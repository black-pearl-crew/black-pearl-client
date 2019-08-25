const express = require('express');
const router = express.Router();
const mining = require('./api');

router.get('/start', (req, res) => {
    mining.lastProof()
        .then(lambdaRes => {
            res.status(200).send(lambdaRes);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

router.get('/balance', (req, res) => {
    mining.getBalance()
        .then(lambdaRes => {
            res.status(200).send(lambdaRes);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

module.exports = router;