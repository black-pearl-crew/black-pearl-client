const lambdaAxios = require('../util/lambdaAxios');
const backendAxios = require('../util/backendAxios');

module.exports = {
    status,
    take,
    drop,
    examine,
    wear,
    sell,
    transmogrify,
    init,
    move,
    changeName,
    wiseExplorer,
    addRoom,
    updateRoom,
    getRoom,
    getGraph
}

/*
    LAMBDA'S BACKEND ENDPOINTS
*/


function status() {
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/status/`);
}

function take(name) {
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/take/`, {
        name
    });
}

function examine(name) {
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/examine/`, {
        name
    });
}

function wear(name) {
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/wear/`, {
        name
    });
}
    
function drop(name) {
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/drop/`, {
        name
    });
}

function sell(name) {
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/sell/`, {
        name
    });
}

function transmogrify(name) {
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/transmogrify/`, {
        name
    });
}

function init() {
    return lambdaAxios.get(`${process.env.LAMBDA}/adv/init/`);
}

function move(direction) {
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/move/`, {
        direction
    });
}

function changeName(name) {
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/change_name/`, {
        name
    });
}


// An accurate map is the wise explorer's best friend.
// By predicting the ID of the destination room,
// you can reduce your action cooldown by 50%.
function wiseExplorer(direction, next_room_id) {
    return lambdaAxios.post(`${process.env.LAMBDA}/adv/move/`, {
        direction,
        next_room_id
    });
}


/*
    OUR BACKEND ENDPOINTS
*/
function addRoom(roomData) {
    return backendAxios.post(`${process.env.SERVER}/api/add-room`, roomData);
}

function updateRoom(roomData) {
    return backendAxios.put(`${process.env.SERVER}/api/update-room`, roomData);
}

function getRoom(roomId) {
    return backendAxios.get(`${process.env.SERVER}/api/get-room/${roomId}`);
}

function getGraph() {
    return backendAxios.get(`${process.env.SERVER}/api/get-graph`);
}