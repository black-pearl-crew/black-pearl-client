const axios = require("../apis/external");

class Traverse {
    constructor(room, graph) {
        this._graph = graph;
        this.currentRoom = room;
        this.stack = [];
        this.visited = new Set();
        this.roomsCollected = new Set();
    }

    get graph() {
        return this._graph;
    }

    set graph(obj) {
        this._graph = obj;
        this.visited = new Set(Object.keys(obj));
    }

    get graphLen() {
        return Object.keys(this.graph).length;
    }


    checkArgs(type,node,vertex) {
        switch(type) {
            case "lastUnvisited":
                return this.getUnvisitedNeighbors(vertex).length > 0;
            case "closestUncollected":
                return !this.roomsCollected.has(vertex);
            case "roomId":
                if (vertex === node) {
                    return true;
                }
                return false;
        }
    }

    bfs(type,node=null) {
        const queue = []
        queue.push([this.currentRoom])
        const found = []
        while (queue.length > 0) {
            const path = queue.shift();
            const vertex = path[path.length - 1];
            if (!found.includes(vertex)) {
                if (this.checkArgs(type,node,vertex)) {
                    return path.slice(1);
                } else {
                    found.push(vertex);
                    for (const nextVertex in this.graph[vertex]) {
                        const newPath = path.slice();
                        newPath.push(this.graph[vertex][nextVertex]);
                        queue.push(newPath);
                    }
                }
            }
        }
        return null;
    }

    randomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    encumbranceCheck() {
        return axios.status()
            .then(({
                data
            }) => {
                if (data.encumbrance === data.strength) {
                    console.log(data)
                    console.log("Backpack full- Return to shop")
                    const pathToShop = this.bfs("roomId", 1);
                    this.roomsCollected.clear()
                    return this.moveBack(pathToShop)
                        .then(() => {
                            return Promise.all(data.inventory.map(item =>
                                axios.sell(item).then(axios.sell(item,true))))
                        })
                        .then(() => {
                            console.log("\u{1F911}\u{1F911}\u{1F911} Items Sold- You A Rich! \u{1F911}\u{1F911}\u{1F911}")
                            return this.collectTreasure()
                        });
                } else {
                    console.log("Collecting treasure...")
                    return this.collectTreasure()
                }
            })
            .catch(printErrors);
    }

    collectTreasure(roomData = null) {
        console.log("Collecting treasure... \u{1F4B0}\u{1F4B0}\u{1F4B0}\u{1F4B0}")

        const checkRoomData = (items, roomId) => {
            this.roomsCollected.add(roomId);
            if (items.length > 0) {
                if (items.includes("shiny treasure")) {
                    return this.take("shiny treasure");
                } else if (items.includes("small treasure")) {
                    return this.take("small treasure");
                } else if (items.includes("tiny treasure")) {
                    return this.take("tiny treasure");
                } else {
                    console.log("\n\n\n\n\n\n\nUnidentified Object Located In Room #", roomId);
                    console.log("Items:", items);
                    return;
                }
            } else {
                return this.goToClosestUncollected()
            }
        }

        if (!roomData) {
            return axios.init()
                .then(({
                    data
                }) => {
                    return checkRoomData(data.items, data.room_id);
                });
        } else {
            return checkRoomData(roomData.items, roomData.room_id);
        }
    }

    take(item) {
        console.log("picking up \u{1F53A}\u{1F53A}", item)
        return axios.take(item)
            .then(() => {
                return this.encumbranceCheck()
            })
    }

    goToClosestUncollected() {
        console.log("going to closest uncollected room....")
        const pathToRoom = this.bfs("closestUncollected");
        return this.moveBack(pathToRoom)
            .then(() => {
                return this.collectTreasure()
            })
    }

    //Move once in a certain direction
    //And update the graph
    move(direction, previousRoomId) {
        axios.move(direction)
            .then(res => {
                // check if room exists in current cache or if connection is not present
                return addRoom(res.data, previousRoomId, direction);
            })
            .then(res => {
                this.graph = res;
                this.currentRoom = this.graph[previousRoomId][direction];
                if (this.currentRoom === null) {
                    console.log("\nBUGG")
                    // console.log("this.graph", this.graph)
                    console.log("previousRoomId", previousRoomId)
                    console.log("direction", direction)
                }
                // console.log(res, "<- new graph", "in room ->", this.currentRoom);
                console.log("entered room", this.currentRoom, "from", previousRoomId);
                this.traverse();
            })
            .catch(printErrors);
    }

    //Move in a certain path by room ID
    //Can be multiple rooms
    moveBack(path) {
        if (path.length === 0) {
            return Promise.resolve()
        } else {
            console.log("moving back along this path:", path)
            const nextRoomId = path.shift();
            const neighbors = this.graph[this.currentRoom];
            let direction;
            for (const dir of Object.keys(neighbors)) {
                if (neighbors[dir] === nextRoomId) {
                    direction = dir;
                    break;
                }
            }

            return axios.wiseExplorer(direction, nextRoomId.toString())
                .then((res) => {
                    this.currentRoom = res.data.room_id;
                    return this.moveBack(path);
                })
                .catch(printErrors)
        }
    }

    //Main Graph Traversal Method
    traverse() {
        this.stack.push(this.currentRoom)

        const unvisitedExits = this.getUnvisitedNeighbors()
        let exitDirection
        if (unvisitedExits.length > 1) {
            exitDirection = unvisitedExits[this.randomInt(unvisitedExits.length)]
        } else if (unvisitedExits.length === 1) {
            exitDirection = unvisitedExits[0]
        } else if (unvisitedExits.length === 0) {
            //Pop current room off stack, don't need any more traversing
            this.currentRoom = this.stack.pop()
            //returns the shortest path back to the last unvisited room
            const shortestPath = this.bfs("lastUnvisited")

            // If there are no unvisited rooms
            // traversal is done
            if (!shortestPath) {
                return this.graph
            }

            // Move back to first unvisited room
            return this.moveBack(shortestPath)
                .then(() => {
                    return this.traverse()
                })

        } else {
            // console.log("no rooms in stack left to traverse")

            //No rooms in stack and no unvisited exits in current room
            //Graph is fully traversed
            return this.graph;
        }

        //If there's a exitDirection that is unvisited
        //Then move in that direction
        this.visited.add(this.currentRoom);
        return this.move(exitDirection, this.currentRoom);
    }

    // checks for unvisited neighbors in the visited property
    getUnvisitedNeighbors(neighbor = null) {
        const directions = neighbor === null ? this.graph[this.currentRoom] : this.graph[neighbor]

        const unvisited = []
        for (let i in directions) {
            if (directions[i] === null && !this.visited.has(directions[i])) {
                unvisited.push(i)
            }
        }
        return unvisited
    }

    findRoomByTitle(title){
        let roomNumber = null
        for (let i in this.rawGraph){
            if(this.rawGraph[i]['title'] === title){
                roomNumber = i
                return roomNumber
            }
        }
        
    }

    goToClosest() {
        console.log("going to closest uncollected room....")
        const pathToRoom = this.bfs("closestUncollected");
        return this.moveBack(pathToRoom)
            .then(() => {
                return this.wanderToMine()
            })
    }

    wanderToMine(){
        if(this.roomsCollected.size < this.graphLen){
            this.roomsCollected.add(this.currentRoom)
            wanderMine()
            .then(res => {
                if(res['errors'].length >0){
                    console.log(res['errors'])
                } else {
                    console.log(res)
                    console.log('Found a place to mine!!!')
                }
                return this.goToClosest()
            })
            .catch(printErrors)

        } else {
            console.log("no more rooms")
            return Promise.resolve()
        }
        
    }

    findMine(){
        return this.goToPoint("Shop")
        .then(res => {
            console.log(res)
            return this.rawGraph[this.currentRoom]
        })
        .catch()
    }

    findShrine(temple){
        return this.goToPoint(temple)
        .then(res => {
            console.log(res)
            return this.rawGraph[this.currentRoom]
        })
        .catch(printErrors)
    }

    goToPoint(room_title){
         const roomID = this.findRoomByTitle(room_title)
         const path = this.bfs("roomId",parseInt(roomID))
         if (path === null){
            throw new Error("Error in path")
         } 
        
        return this.moveBack(path)
        .then( () => {
            if (this.currentRoom.toString() === roomID){
                return this.currentRoom
            } else {
                console.log(roomID,this.currentRoom.toString())
                throw new Error("Error in go to point")
            }
            
        })
        .catch(printErrors)
    }

    inspectRoom(roomData) {
        if(roomData.title.toLowerCase().includes("shop")) {
            console.log(this.shops,typeof this.shops)
            this.shops.add(roomData.room_id);
            console.log("Shop Found At Room #", roomData.room_id)
        }
        if(roomData.title.toLowerCase().includes("shrine")) {
            this.shrine.add(roomData.room_id);
            console.log("Shrine Found At Room #", roomData.room_id)
        }
        if(roomData.title.toLowerCase().includes("transmogriphier")) {
            this.transmogrifiers.add(roomData.room_id);
            console.log("Transmogrifier Found At Room #", roomData.room_id)
        }
        this.terrains.add(roomData.terrain)
        this.elevations.add(roomData.elevation)
        roomData.items.forEach(item => {
            this.items.add(item)
        });
    }

}

//Start traversal
function traversal() {
    let currentRoomId;
    //Get our current room from Lambda API
    axios.init()
        .then(res => {
            //Save currentRoomId for later
            currentRoomId = res.data.room_id
            //Initialize Graph
            return startCheck(res.data)
        })
        .then(res => {
            console.log(res, "<- Graph; Starting traversal...")
            //Start traversing the graph!
            const traveler = new Traverse(currentRoomId, res)
            return traveler.traverse()
        })
        .catch(printErrors)
}

//Collect Treasure
function collectTreasure() {
    let currentRoomId;
    //Get our current room from Lambda API
    axios.init()
        .then(res => {
            //Save currentRoomId for later
            currentRoomId = res.data.room_id
            //Initialize Graph
            return startCheck(res.data)
        })
        .then(res => {
            // Start traversing the graph!
            // And collecting treasure!
            const traveler = new Traverse(currentRoomId, res);
            return traveler.encumbranceCheck();
        })
        .catch(printErrors)
}

//Initialization
function startCheck(room) {
    // room is the current from the Lambda server
    // console.log("\n=============\ncurrent room from Lambda\n", room)

    //Get graph from our backend
    return axios.getGraph()
        .then(res => {
            //Parses graph
            const graph = parseGraph(res.data)
            return graph
        })
        .then(graph => {
            const room_id = room["room_id"]

            //If there are no rooms in the database then graph will be undefined
            if (!graph || !graph[room_id]) {
                return addRoom(room)
            } else {
                return graph
            }
        })
        .catch(printErrors)
}

//Add a room to the backend database
//There are three different possibilities:

//1. The new room is being created in startCheck() (there is no previous room in that case)
//1a. If the new room DOES exist then returns reloadGraph()
//1b. If the new room DOES NOT exist then returns parseGraph()

//2. The new room is being created in move() AND The new room DOES exist
//2a. Returns parseGraph()

//3. The new room is being created in move() AND The new room DOES NOT exist
//3a. Returns parseGraph()
function addRoom(newRoom, previousRoomId, directionMoved) {
    const oppositeDirection = {
        n: "s",
        s: "n",
        w: "e",
        e: "w"
    }
    newRoom = parseRoomData(newRoom);
    //If called in startCheck()
    if (!previousRoomId) {
        return axios.addRoom(newRoom)
            .then(res => {
                return parseGraph(res.data)
            })
            .catch(printErrors);
    } else {
        return axios.addRoom({
                ...newRoom,
                ["room_" + oppositeDirection[directionMoved]]: previousRoomId
            })
            .then(() => {

                // Everything between here and catch() occurs
                // If The newRoom does not exist
                return axios.updateRoom({
                    room_id: previousRoomId,
                    ["room_" + directionMoved]: newRoom.room_id
                });
            })
            .then(res => {
                return parseGraph(res.data)
            })
            .catch(() => {
                // Everything below occurs
                // If the new room exists
                return axios.updateRoom({
                    room_id: newRoom.room_id,
                    ["room_" + oppositeDirection[directionMoved]]: previousRoomId
                });
            })
            .then(() => {
                return axios.updateRoom({
                    room_id: previousRoomId,
                    ["room_" + directionMoved]: newRoom.room_id
                });
            })
            .then(res => {
                return parseGraph(res.data);
            });
    }
}

function getGraphDB(){
    return axios.getGraph()
        .then(res => {
            return res.data
        })
        .catch(printErrors)
}

function initExplore(){
    let currentRoomId;
    let traveler
    //Get our current room from Lambda API
    return axios.init()
        .then(res => {
            //Save currentRoomId for later
            currentRoomId = res.data.room_id
            //Initialize Graph
            return startCheck(res.data)
        })
        .then(res => {
            console.log(res, "<- Graph; Starting traversal...")
            //Start traversing the graph!
            traveler = new Traverse(currentRoomId, res)
            return traveler.traverse()
        })
        .then(getGraphDB)
        .then(res => ({"rawGraph":res,traveler}))
        .catch(printErrors)
}

function requestName(name){
    return axios.changeName(name)
    .then(res => {
        return res.data
    })
    .catch(printErrors)
}

function pray(){
    return axios.pray()
    .then(res => {
        return res.data
    })
    .catch(printErrors)
}

function prayAtShrine(temple){
    return initExplore()
    .then( res => {
        res.traveler.rawGraph = parseRawGraph(res.rawGraph)
        return res.traveler.findShrine(temple)
    })
    .then(res => {
        console.log(res,"\nFound a place to pray")
        return pray()
    })
    .then(res => {
        console.log(res,"from pray at shrine")
        return res.data
    })
    .catch(printErrors)
}

function mineCoinz(roomId) {
    let currentRoomId;
    //Get our current room from Lambda API
    axios.init()
        .then(res => {
            //Save currentRoomId for later
            currentRoomId = res.data.room_id
            //Initialize Graph
            return startCheck(res.data)
        })
        .then(res => {
            // Start traversing the graph to the mine!
            console.log("Traversing to mining location! \u{26CF}\u{26CF}")
            const traveler = new Traverse(currentRoomId, res);
            const path = traveler.bfs("roomId", roomId);
            return traveler.moveBack(path);
        })
        .then(res => {
            //Mine Coins
            const miningApi = require('../apis/mining');
            miningApi.startMining();
        })
        .catch(printErrors)
}

function wanderMine(){
    return axios.submitProof([1])
    .then(res => {
        console.log(res.data)
        return res.data
    })
    .catch(printErrors)
}

function findMine(){
    return initExplore()
    .then( res => {
        res.traveler.rawGraph = parseRawGraph(res.rawGraph)
        return res.traveler.wanderToMine()
        // return res.traveler.findMine()
    })
    .then(res => {
        console.log(res,"\nFound a place to mine")
        return res
    })
    .catch(printErrors)
}

function changeName(name){
    return initExplore()
    .then( res => {
        res.traveler.rawGraph = parseRawGraph(res.rawGraph)
        return res.traveler.goToPoint("Pirate Ry's")
    })
    .then(() => {
        return requestName(name)
    })
    .then(res => {
        console.log(res,"\nResponse from the Name Changer")
        return res
    })
    .catch(printErrors)
}


function printErrors(error) {
    throw error
}

function parseRawGraph(arr){
    const graph = {}
    for (let i of arr) {
        const key = i['room_id']
        graph[key] = {'title':i['title'],'description':i['description']}
    }
    return graph
}

function parseGraph(arr) {
    const graph = {}
    if (arr.length !== 0) {
        for (let i of arr) {
            const key = i["room_id"]

            const directions = {}

            if (i["exit_n"]) {
                directions["n"] = i["room_n"]
            }
            if (i["exit_s"]) {
                directions["s"] = i["room_s"]
            }
            if (i["exit_e"]) {
                directions["e"] = i["room_e"]
            }
            if (i["exit_w"]) {
                directions["w"] = i["room_w"]
            }

            graph[key] = {
                ...directions
            }
        }
        return graph
    }
    return undefined
}

function parseRoomData(room) {
    const roomTableKeys = ["room_id", "title", "description", "coordinate_x", "coordinate_y", "elevation", "terrain"]
    const exitKeys = ['n', 's', 'e', 'w']
    const request = {}
    const roomExits = new Set(room['exits'])
    for (let i of roomTableKeys) {
        request[i] = room[i]
    }

    const regex = /\(|\)/g;

    let coords = room['coordinates']
    coords = coords.replace(regex, "").split(",").map(e => parseInt(e))
    request["coordinate_x"] = coords[0], request["coordinate_y"] = coords[1]


    for (let i of exitKeys) {
        if (roomExits.has(i)) {
            request[`exit_${i}`] = true
        } else {
            request[`exit_${i}`] = false
        }
    }

    return request;
}

module.exports = {
    traversal,
    collectTreasure,
    changeName,
    findMine,
    prayAtShrine,
    mineCoinz
}


// shops = 1
// transmogrifiers = 495
// name changer = 497
// shrines = 461
// items [ 'tiny treasure', 'small treasure', 'shiny treasure' ]
// terrains [ 'NORMAL', 'MOUNTAIN' ]
