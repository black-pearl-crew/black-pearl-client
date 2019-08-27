const externalApi = require('../apis/external');
const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
    externalApi.status()
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