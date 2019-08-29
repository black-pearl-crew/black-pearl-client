const externalApi = require('../apis/external');
const express = require('express');
const router = express.Router();

router.get('/all', (req, res) => {
    externalApi.getGraph()
        .then(response => {
            res.status(200).send(response.data);
        })
        .catch(err => {
            res.status(400).send({
                message: err.message
            })
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
            res.status(400).send({
                message: err.message
            })
        });
});

router.get('/room-dict', (req, res) => {
    externalApi.getGraph()
        .then(response => {
            const roomLookup = {};
            response.data.forEach(room => {
                roomLookup[room.room_id] = room;
            });
            res.status(200).send(roomLookup);
        })
        .catch(err => {
            res.status(400).send({
                message: err.message
            })
        });
});

router.get('/map-graph', (req, res) => {
    externalApi.getGraph()
        .then(response => {
            let yCoords = []
            let xCoords = []
            const mapGraph = {}
            response.data.forEach(room => {
                const x = room.coordinate_x
                const y = room.coordinate_y
                xCoords.push(x);
                yCoords.push(y);
                if (mapGraph[y]) {
                    mapGraph[y][x] = room
                } else {
                    mapGraph[y] = {
                        [x]: room
                    }
                }
            });
            res.status(200).send({
                xCoords,
                yCoords,
                mapGraph
            });
        })
        .catch(err => {
            res.status(400).send({
                message: err.message
            })
        });
});

module.exports = router;