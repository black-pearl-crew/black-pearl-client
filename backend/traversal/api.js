const axios = require("../apis/external")


class Traverse {
    constructor(room,graph){
        this.graph = graph
        this.currentRoom = room
        this.stack = []
        this.visited = new Set();
    }

    get graphLen(){
        return Object.keys(this.graph).length
    }

    bft(){
        console.log("bft")
        throw new Error("Hi it's me")
    }

    randomInt(max){
        return Math.floor(Math.random() * Math.floor(max))
    }

    move(direction){
        axios.move(direction)
        .then(res => addRoom(res.data))
        .then(res => {
            this.currentRoom = res[0]
            this.graph = res[1]
        })
        .catch(printErrors)
    }


    dirLookUp(from,to){
        const from_room = from.toString()
        const to_room = to.toString()
        const directions = this.graph[from_room]

        for(let i in directions){
            if(directions[i] !== null && directions[i].toString() === to_room){
                return directions[i]
            }
        }
        throw new Error("An error has occured in dirlookup")
    }

    traverse(){
        this.stack.push(this.currentRoom)
        if(this.graphLen < 500){
            const exits = this.getNeighbors()
            let exit
            console.log(exits,"exits")
            if(exits.length > 1){
                exit =  exits[this.randomInt(exits.length)] 
            } else if(exits.length === 1){
                exit = exits[0]
            }else if (exits.length === 0 && this.stack > 1){
                const prevRoom = this.stack.pop()
                console.log("dir")
                this.dirLookUp(this.currentRoom,prevRoom)
                this.bft()
            } else {
                console.log("hit else in traversal")
                this.bft()
            }

            this.move(exit)
 

        } else {
            return this.graph
        }
    }

    getNeighbors(){
        const directions = this.graph[this.currentRoom]
        console.log(this.graph,this.currentRoom,"neighbors")
        const unvisited = []
        for(let i in directions){
            if (!directions[i] && !this.visited.has(directions[i]) ){
                unvisited.push(i)
            }
        }
        return unvisited
    }

}

function addRoom(room){
    const request = parseRoomData(room)
    return axios.addRoom(request)
            .then(res => {
                console.log("hit",res.data)
                return [room["room_id"],parseGraph(res.data)]
            })
            .catch(printErrors)
}

function startCheck(room){
    // room is the current from the Lambda server
    console.log("\n=============\ncurrent room from Lambda\n",room)
    return axios.getGraph()
    .then(res => {
        const graph = parseGraph(res.data)
        console.log("parsed graph\n",graph)
        return graph
    })
    .then( graph => {
        const room_id = room["room_id"]
        if(!graph || !graph[room_id]){
            return addRoom(room)
        } else {
            return [room["room_id"],graph]
        }
    })
    .then(res => res)
    .catch(printErrors)
}


function traversal(){
    axios.init()
    .then(res => {
        return startCheck(res.data)
    })
    .then(res => {
        console.log(res,"traversal res")
        const traveler = new Traverse(res[0],res[1])
        traveler.traverse()
    })
    .catch(printErrors)
}

function printErrors(error){
    throw error
}


function parseGraph(arr){
    if (arr.length !== 0){
        const graph = {}
        console.log("parseGraph array",arr, graph)
        for(let i of arr){
            const key = i["room_id"]
    
            const directions = {}
            
            if (i["exit_n"]){ directions["n"] = i["room_n"]}
            if (i["exit_s"]){ directions["s"] = i["room_s"]}
            if (i["exit_e"]){ directions["e"] = i["room_e"]}
            if (i["exit_w"]){ directions["w"] = i["room_w"]}
            
            graph[key] = {...directions}
        }
        return graph
    } 
    return undefined
}

function parseRoomData(room){
    const roomTableKeys = ["room_id","title","description","coordinate_x","coordinate_y","elevation","terrain"]
    const exitKeys = [ 'n', 's', 'e', 'w' ]
    const request = {}
    const roomExits = new Set(room['exits'])
    for(let i of roomTableKeys){
        request[i] = room[i]
    }
    console.log(room, "parse room data")

    const regex = /\(|\)/g;

    let coords = room['coordinates']
    coords = coords.replace(regex,"").split(",").map(e => parseInt(e))
    request["coordinate_x"] = coords[0] , request["coordinate_y"] = coords[1]
    

    for(let i of exitKeys){
        if(roomExits.has(i)){
            request[`exit_${i}`] = true
        } else {
            request[`exit_${i}`] = false
        }
    }
    
    return request
}

module.exports = traversal