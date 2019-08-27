const axios = require("../apis/external")


class Traverse {
    constructor(room,graph){
        this._graph = graph
        this.currentRoom = room
        this.stack = []
        this.visited = new Set();
    }

    get graph(){
        return this._graph
    }

    set graph(obj){
        this._graph = obj
        this.visited = new Set(Object.keys(obj))
        
    }

    get graphLen(){
        return Object.keys(this.graph).length
    }

    getShortestPath(unvisited,parentTree){
        const shortest_path = []
        let parent = parentTree[unvisited]
        shortest_path.push(unvisited)
        shortest_path.push(parent)
        // will stop at null value
        while(parentTree[parent]){
            parent = parentTree[parent]
            shortest_path.push(parent)
        }
        shortest_path.reverse()
        return shortest_path
    }

    bfs(){
        let vertex = this.currentRoom
        const q = [vertex]
        const parentTree = {[vertex]:null}
        const visited = new Set()
        let neighbors
        let neighbor
        let shortestPath
        while(visited.size < this.graphLen){
            vertex = q.shift()
            visited.add(vertex)
            neighbors = this.graph[vertex]
            
            for(i in neighbors){
                neighbor = neighbors[i]
                if (neighbor === null) {
                    
                    parentTree[vertex] = neighbor
                    console.log(vertex,"vertex has an unvisited direction",parentTree)
                    shortestPath =  this.getShortestPath(vertex,parentTree)
                    break
                } else {
                    q.push(neighbors[i])
                    parentTree[neighbor] = vertex
                
                }
            }

        }

        return shortestPath

    }

    randomInt(max){
        return Math.floor(Math.random() * Math.floor(max))
    }

    move(direction){
        axios.move(direction)
        .then(res => {
            // check if room exists in current cache or if connection is not present
            return addRoom(res.data)
        })
        .then(res => {
            console.log(res,"res from move")
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

                // still working on bfs
                // return this.bfs()
                throw new Error
            } else {
                console.log("hit else in traversal")
                // return this.bfs()
                throw new Error
            }
            this.visited.add(this.currentRoom)
            return this.move(exit)
 

        } else {
            return this.graph
        }
    }

    // checks for unvisited neighbors in the visited property
    getNeighbors(neighbor=null){
        const directions = neighbor === null ? this.graph[this.currentRoom] : this.graph[neighbor]
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

function reloadGraph(){
    Promise.all([getCurrentRoom(),getGraph()])
    .then(res => {
        console.log(res,"res from reload graph")
        throw new Error("testing reload graph")
        const currentRoom = res[0]["room_id"]
        return [currentRoom,res[1]]
    })
    .catch(printErrors)
    
}

function getCurrentRoom(){
    return axios.init()
    .then(res => {
        return res.data
    })
    .catch(printErrors)
}

function getGraph(){
    return axios.getGraph()
    .then(res => {
        const graph = parseGraph(res.data)
        return graph
    }).catch(printErrors)
}


function addRoom(room){
    const request = parseRoomData(room)
    return axios.addRoom(request)
            .then(res => {
                console.log("hit",res.data)
                return [room["room_id"],parseGraph(res.data)]
            })
            .catch((err) => {
                console.log(Object.keys(err),"add room error")
                return reloadGraph()
            })
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
        console.log(graph,"start check graph")
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
        return traveler.traverse()
    })
    .catch(printErrors)
}

function printErrors(error){
    console.log(error)
    throw error
}


function parseGraph(arr){
    const graph = {}
    if (arr.length !== 0){
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