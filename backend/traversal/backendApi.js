const axios = require('../backendAxios');

module.exports = {
    addRoom,
    updateRoom,
    getRoom,
    getGraph
}

function addRoom(roomData) {
    return axios.post(`${process.env.SERVER}/api/add-room`, roomData);
}

function updateRoom(roomData) {
    return axios.put(`${process.env.SERVER}/api/update-room`, roomData);
}

function getRoom(roomId) {
    return axios.get(`${process.env.SERVER}/api/get-room/${roomId}`);
}

function getGraph() {
    return axios.get(`${process.env.SERVER}/api/get-graph`);
}