const externalApi = require('../apis/external');
const express = require('express');
const router = express.Router();

router.get('/init', (req, res) => {
    externalApi.init()
    .then(response => {
        if (response.data.errors.length > 0)
            throw new Error(response.data.errors[0])  
        res.status(200).send(response.data);
    })
    .catch(err => {
        res.status(400).send({message: err.message})
    });
});

router.post('/move', (req, res) => {
    externalApi.move(req.body.direction)
    .then(response => {
        if (response.data.errors.length > 0)
            throw new Error(response.data.errors[0])  
        res.status(200).send(response.data);
    })
    .catch(err => {
        res.status(400).send({message: err.message})
    });
});

router.post('/wise-explorer', (req, res) => {
    console.log("hhaa")
    externalApi.wiseExplorer(req.body.direction,req.body.nextRoomId)
    .then(response => {
        if (response.data.errors.length > 0)
            throw new Error(response.data.errors[0])  
        res.status(200).send(response.data);
    })
    .catch(err => {
        res.status(400).send({message: err.message})
    });
});

module.exports = router;