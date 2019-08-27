module.exports = {
    status,
    pickup,
    drop,
    sell,
    init,
    move,
    wiseExplorer,
    transmogrify,
    addRoom,
    updateRoom,
    getRoom,
    getGraph
}

/*
    LAMBDA'S BACKEND ENDPOINTS
*/

function status() {
    const lambdaAxios = require('../util/lambdaAxios');
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/status/`, {
        name
    });
}

function pickup(name) {
    const lambdaAxios = require('../util/lambdaAxios');
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/pickup/`, {
        name
    });
}

function drop(name) {
    const lambdaAxios = require('../util/lambdaAxios');
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/drop/`, {
        name
    });
}

function sell(name) {
    const lambdaAxios = require('../util/lambdaAxios');
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/sell/`, {
        name
    });
}

function init() {
    const lambdaAxios = require('../util/lambdaAxios');
    return lambdaAxios.get(`${process.env.LAMBDA}/adv/init/`);
}

function move(direction) {
    const lambdaAxios = require('../util/lambdaAxios');
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/move/`, {
        direction
    });
}

function wiseExplorer(direction, next_room_id) {
    const lambdaAxios = require('../util/lambdaAxios');
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/move/`, {
        direction,
        next_room_id
    });
}

function transmogrify(name) {
    const lambdaAxios = require('../util/lambdaAxios');
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/transmogrify/`, {
        name
    });
}

/*
    OUR BACKEND ENDPOINTS
*/
function addRoom(roomData) {
    const backendAxios = require('../util/backendAxios');
    return backendAxios.post(`${process.env.SERVER}/api/add-room`, roomData);
}

function updateRoom(roomData) {
    const backendAxios = require('../util/backendAxios');
    return backendAxios.put(`${process.env.SERVER}/api/update-room`, roomData);
}

function getRoom(roomId) {
    const backendAxios = require('../util/backendAxios');
    return backendAxios.get(`${process.env.SERVER}/api/get-room/${roomId}`);
}

function getGraph() {
    const backendAxios = require('../util/backendAxios');
    return backendAxios.get(`${process.env.SERVER}/api/get-graph`);
}