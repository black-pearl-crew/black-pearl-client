const externalApi = require('../apis/external');
const express = require('express');
const router = express.Router();

router.get('/all', (req, res) => {
    externalApi.getGraph()
    .then(response => {
        res.status(200).send(response.data);
    })
    .catch(err => {
        res.status(400).send({message: err.message})
    });
});

router.get('/one/:id', (req, res) => {
    console.log(Number(req.params.id))
    externalApi.getRoom(Number(req.params.id))
    .then(response => {
        res.status(200).send(response.data);
    })
    .catch(err => {
        console.log(err)
        res.status(400).send({message: err.message})
    });
});

module.exports = router;