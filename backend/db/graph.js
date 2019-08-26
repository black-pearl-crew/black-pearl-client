const db = require('../data/config');

module.exports = trxClass

function trxClass(){
    return new TRX_Chain
}


class TRX_Chain {

    constructor (){
        this.trxProvider = db.transactionProvider()
        this.trx = null
    }

    async getRoom(roomID){
        this.trx = await this.trxProvider()
        try{
            
            const res = await TRX_Chain.getRoom_trx(roomID,this.trx)
            this.trx.commit()
            return res
        }catch(e){
            this.trx.rollback()
            throw e
        }
    }

    static async getRoom_trx(roomID,trx){
        try{
            const res = await trx('graph')
            .where({"room_id":roomID})
            .returning('*')
            .first()
            return res
        }catch(e){
            throw e
        }
    }


    async addRoom(roomData){
        this.trx = await this.trxProvider()
        try{
            // Get room
            const currRoomID = roomData["room_id"]
            const room = await TRX_Chain.getRoom_trx(currRoomID,this.trx)

            if(room === undefined){
                // Add room 
                var addedRoom = await TRX_Chain.addRoom_trx(roomData,this.trx)
            }

            this.trx.commit()
            return addedRoom
        }catch(e){
            this.trx.rollback()
            throw e
        }
    }

    static async addRoom_trx(currRoomData,trx){
        try{
            // room doesn't exists in db, create entry
            const currRoomID = currRoomData["room_id"]
            const jsonString = JSON.stringify(currRoomData)
            room = await trx('graph')
                .insert({'room_id':currRoomID,'room_data':jsonString})
                .returning('*')

            room = room[0]
            const exits = currRoomData.exits.map(exit => {
                return {"from_room_FK":room['room_id'],"direction":exit}
            })
                
            await trx('directions').insert(exits);
            return room
        }catch(e){
            throw e
        }
       
    }

    async move(prevRoomID,movement,currRoomData){
        this.trx = await this.trxProvider()
        try{
            const currRoomID = currRoomData["room_id"]
            let room = await TRX_Chain.getRoom_trx(currRoomID,this.trx)

            if(room === undefined){
                // Add room 
                room = await TRX_Chain.addRoom_trx(currRoomData,this.trx)
            }

            const res = await TRX_Chain.move_trx(prevRoomID,movement,currRoomID,this.trx)

            this.trx.commit()
            return res
        }catch(e){
            this.trx.rollback()
            throw e
        }
    }

    static async move_trx(prevRoomID,movement,room,trx){
        try{
            // room = room['room_id']
            let vertex = await trx('directions')
                .where({'from_room_FK':prevRoomID,"direction":movement,'to_room_FK':room})
                .returning('*')
                .first()
    
            // if vertices don't exists in db, create entry
            if(vertex === undefined){
                 // Insert Vertices
                const direc = {'s':'n','n':'s','e':'w','w':'e'}
                const vertices = [{"from_room_FK":prevRoomID,"direction":movement,'to_room_FK':room} ,{'from_room_FK':room,"direction":direc[movement],'to_room_FK':prevRoomID}]
                const vert_prom = vertices.map(e => {
                    return trx('directions').where('from_room_FK',e['from_room_FK']).andWhere('direction',e['direction']).update('to_room_FK',e['to_room_FK']).returning('*');
                })
                
                return Promise.all(vert_prom)
                .then( (e) => {
                    return e
                }
                )
                .catch((e) => {
                    console.log(e.message)
                    throw new Error("An error has occured")
                } )
            }

        }catch(e){
            throw e
        }
    }


    async getGraph(){
        this.trx = await this.trxProvider()
        try{
            const res = await TRX_Chain.getGraph_trx(this.trx)
            this.trx.commit()
            return res
        }catch(e){
            this.trx.rollback()
            throw e
        }
    }

    static async getGraph_trx(trx){
        try{
            // get all rooms
            const rooms = await trx('graph').select('room_id')
            // get all directions
            const graph_prom = rooms.map(room => {
                return trx('directions')
                .select('to_room_FK','direction')
                .where('from_room_FK',room['room_id'])
                })
    
            return Promise.all(graph_prom)
                .then( (e) => {
                    const graph = {}
                    e.forEach( (room,index) => {
                        let direction = {}
                        room.forEach( dir => {
                            const key = dir["direction"]
                            direction[key] =  dir['to_room_FK']
                        })
                        const id = rooms[index]['room_id']
                        graph[id] = direction
    
                    })
                    return graph
                }
                )
                .catch((e) => {
                    console.log(e.message)
                    throw new Error("An error has occured test")
                } )

        }catch(e){
            throw e
        }
    }

}