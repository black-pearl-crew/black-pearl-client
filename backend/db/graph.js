const db = require('../data/config');

module.exports = {
    addRoom,
    getRoom,
    currentRoom,
    move,
    getGraph
}

async function move(prevRoomID,movement,currRoomData){
    const trx = await db.transaction();
    try{ 
        const currRoomID = currRoomData['room_id']
        let room = await trx('graph')
            .select("room_id")
            .where({"room_id":currRoomID})
            .first()

        // if room doesn't exists in db, create entry
        if(room === undefined){
             
            const jsonString = JSON.stringify(currRoomData)
            room = await trx('graph')
                .insert({'room_id':currRoomID,'room_data':jsonString})
                .returning('*')

            // Insert available directions
            room = room[0]
            const exits = currRoomData.exits.map(exit => {
                return {"from_room_FK":room['room_id'],"direction":exit}
            })
                
            const test_dir = await trx('directions').insert(exits);
        } 

        
        room = room['room_id']
        let vertex = await trx('directions')
            .where({'from_room_FK':prevRoomID,"direction":movement,'to_room_FK':room})
            .returning('*')
            .first()

        // if vertices don't exists in db, create entry
        if(vertex === undefined){
             // Insert Vertices
            const direc = {'s':'n','n':'s','e':'w','w':'e'}
            const vertices = [{"from_room_FK":prevRoomID,"direction":movement,'to_room_FK':room} ,{'from_room_FK':room,"direction":direc[movement],'to_room_FK':prevRoomID}]
            vert_prom = vertices.map(e => {
                return trx('directions').where('from_room_FK',e['from_room_FK']).andWhere('direction',e['direction']).update('to_room_FK',e['to_room_FK']).returning('*');
            })
            
            return Promise.all(vert_prom)
            .then( (e) => {
                trx.commit()
                return e
            }
            )
            .catch((e) => {
                console.log(e.message)
                throw new Error("An error has occured")
            } )
        }
        
    }catch(e){
        console.log("An error has occured")
        trx.rollback()
    }
}


function currentRoom() {
    return db('graph')
        .orderBy('created_at')
        .first()
        .then(entry => {
            return entry
        })
        .catch(err => {
            return err
        });
}

async function addRoom(currRoomData) {
    const trx = await db.transaction();
    try{ 
        const currRoomID = currRoomData["room_id"]
        let room = await trx('graph')
            .where({"room_id":currRoomID})
            .returning('*')
            .first()

        if(room === undefined){
             // room doesn't exists in db, create entry
            const jsonString = JSON.stringify(currRoomData)
            room = await trx('graph')
                .insert({'room_id':currRoomID,'room_data':jsonString})
                .returning('*')

            room = room[0]
            const exits = currRoomData.exits.map(exit => {
                return {"from_room_FK":room['room_id'],"direction":exit}
            })
                
            await trx('directions').insert(exits);
        } 
        
        trx.commit()
        return room
    }catch(e){
        console.log(e.message)
        console.log("An error has occured in add room")
        trx.rollback()
    }
}

function getRoom(roomID,trx=null) {
    if( trx === null){
        var test = trx
    }else{
        var test = db
    }
    return test('graph')
        .where({"room_id":roomID})
        .returning('*')
        .first()
        .then(entry => {
            return entry
        })
        .catch(err => {
            return err
        });
}

async function getGraph() {
    const trx = await db.transaction();
    try{
        const rooms = await trx('graph').select('room_id')
        const graph_prom = rooms.map(room => {
            return trx('directions')
            .select('to_room_FK','direction')
            .where('from_room_FK',room['room_id'])
            })

        return Promise.all(graph_prom)
            .then( (e) => {

                trx.commit()
                graph = {}
                e.forEach( (room,index) => {
                    graph[rooms[index]['room_id']] = room

                })
                return graph
            }
            )
            .catch((e) => {
                console.log(e.message)
                throw new Error("An error has occured")
            } )
    }catch(e){
        console.log(e)
        trx.rollback()
    }
}