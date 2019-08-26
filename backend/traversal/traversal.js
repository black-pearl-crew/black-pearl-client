const axios = require("../axios")
const db = require("../db/graph")


// function DFS(graph){
//     move = null
//     return move
// }

async function traversal(room){
    const currRoom = await currentRoom()
    // if currentRoom is undefined, then the db is empty. The db can be empty from starting for the first time, 
    // or db rollback
    // request from the init endpoint to start db

    // const newRoom = await addRoom(room)
    // console.log(currRoom,"current room")
    // console.log(newRoom,"new room")

    // handle undefined result from resolved promise
    room0 = {
        "room_id": 0, 
        "title": 
        "A Dark Room", 
        "description": 
        "You cannot see anything.", 
        "coordinates": "(60,60)", 
        "exits": ["n", "s", "e", "w"], 
        "cooldown": 1.0, 
        "errors": [], 
        "messages": []
    }
    const firstRoom = await db.addRoom(room0)
    console.log(firstRoom)
    const res = await db.move(0,"n",room)
    console.log(res,"get Room")
    const graph = await db.getGraph()
    console.log(graph)
}

// async function addRoom(room){
//     const id = room.room_id
//     const newRoom = await db.addRoom(id,room)
//     return newRoom
// }

async function getRoom(id){
    const room = await db.getRoom(id)
    return room
}

async function move(previousRoom,currentRoom){
    const id = room.room_id
    const newRoom = await db.addRoom(id,room)
    return newRoom
}

async function currentRoom(){
    room = await db.currentRoom()
    return room
}


// db.getRoom()
// .then()
// .catch()

// // Stringify JSON before inserting in the database
// db.addRoom()
// .then()
// .catch()

// only get if there is nothing in the database
// axios
// .get('https://lambda-treasure-hunt.herokuapp.com/api/adv/init/')
//     .then(res => {
//         console.log(res.data)
//     })
//     .catch(err => {
//         console.log(err)
// })

// axios
// .post('https://lambda-treasure-hunt.herokuapp.com/api/adv/move/', {
//     direction: 's'})
//     .then(res => {
//         console.log(res.data)
//     })
//     .catch(err => {
//         console.log(err)
// })

module.exports = traversal