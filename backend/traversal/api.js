const axios = require("../apis/external");

class Traverse {
    constructor(room, graph) {
        this._graph = graph;
        this.currentRoom = room;
        this.stack = [];
        this.visited = new Set();
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

    getShortestPath(unvisited, parentTree) {
        const shortest_path = [];
        let parent = parentTree[unvisited];
        shortest_path.push(unvisited);
        shortest_path.push(parent);
        // will stop at null value
        while (parentTree[parent]) {
            parent = parentTree[parent];
            shortest_path.push(parent);
        }
        shortest_path.reverse()
        return shortest_path
    }

    bfs() {
        const queue = []
        queue.push([this.currentRoom])
        const found = []
        while (queue.length > 0) {
            const path = queue.shift();
            const vertex = path[path.length - 1];
            if (!found.includes(vertex)) {
                if (this.getUnvisitedNeighbors(vertex).length > 0) {
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
        return Math.floor(Math.random() * Math.floor(max))
    }


    //Move once in a certain direction
    //And update the graph
    move(direction, previousRoomId) {
        // console.log("currentRoom", this.currentRoom)
        // console.log("moving", direction)
        axios.move(direction)
            .then(res => {
                console.log(res.data, "entered this room")
                // check if room exists in current cache or if connection is not present
                return addRoom(res.data, previousRoomId, direction)
            })
            .then(res => {
                console.log(res, "new graph")
                this.graph = res;
                this.currentRoom = this.graph[previousRoomId][direction];
                // console.log("currentRoom variables", previousRoomId, direction)
                // console.log(this.currentRoom)
                this.traverse();
            })
            .catch(printErrors);
    }

    //Move in a certain path by room ID
    //Can be multiple rooms
    moveBack(path) {
        // console.log("moving back along this path:", path)
        if (path.length === 0) {
            return;
        } else {
            const nextRoomId = path.shift();
            const neighbors = this.graph[this.currentRoom];
            // console.log("next room to move back to", nextRoomId)
            // console.log("neighbors", neighbors)
            let direction;
            for (const dir of Object.keys(neighbors)) {
                // console.log("dir",dir, "neighbors[dir]", neighbors[dir])
                if (neighbors[dir] === nextRoomId) {
                    // console.log(nextRoomId, "is in this direction: ", dir)
                    direction = dir;
                    break;
                }
            }
            // console.log("moving back- headed", direction)
            return axios.move(direction)
                .then((res) => {
                    this.currentRoom = res.data.room_id;
                    return this.moveBack(path);
                })
                .catch(printErrors);
        }
    }

    //Receives previous room ID and current room ID
    dirLookUp(from, to) {
        const from_room = from.toString()
        const to_room = to.toString()
        const directions = this.graph[from_room]
        // console.log(directions, "inside dirLookup")

        for (let i in directions) {
            if (directions[i] !== null && directions[i].toString() === to_room) {
                return directions[i]
            }
        }
        throw new Error("An error has occured in dirlookup")
    }

    //Main Graph Traversal Method
    traverse() {
        this.stack.push(this.currentRoom)
        console.log("current", this.currentRoom)

        const unvisitedExits = this.getUnvisitedNeighbors()
        let exitDirection
        // console.log(unvisitedExits, "exits")
        if (unvisitedExits.length > 1) {
            exitDirection = unvisitedExits[this.randomInt(unvisitedExits.length)]
        } else if (unvisitedExits.length === 1) {
            exitDirection = unvisitedExits[0]
        } else if (unvisitedExits.length === 0) {
            //Pop current room off stack, don't need any more traversing
            this.currentRoom = this.stack.pop()
            //returns the shortest path back to the last unvisited room
            const shortestPath = this.bfs()

            // If there are no unvisited rooms
            // traversal is done
            if(!shortestPath) {
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
        // console.log(this.graph, this.currentRoom, "neighbors")
        // console.log(directions, "neighbors")
        const unvisited = []
        for (let i in directions) {
            // console.log(!directions[i], !this.visited.has(directions[i]), "unvisited logic")
            if (!directions[i] && !this.visited.has(directions[i])) {
                unvisited.push(i)
            }
        }
        return unvisited
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

//Initialization
function startCheck(room) {
    // room is the current from the Lambda server
    // console.log("\n=============\ncurrent room from Lambda\n", room)

    //Get graph from our backend
    return axios.getGraph()
        .then(res => {
            //Parses graph
            const graph = parseGraph(res.data)
            // console.log("parsed graph\n", graph)
            return graph
        })
        .then(graph => {
            const room_id = room["room_id"]
            // console.log(graph, "start check graph")

            //If there are no rooms in the database then graph will be undefined
            if (!graph || !graph[room_id]) {
                return addRoom(room)
            } else {
                return graph
            }
        })
        .catch(printErrors)
}


function reloadGraph() {
    Promise.all([getCurrentRoom(), getGraph()])
        .then(res => {
            // console.log(res, "res from reload graph")
            throw new Error("testing reload graph")
            const currentRoom = res[0]["room_id"]
            return [currentRoom, res[1]]
        })
        .catch(printErrors)

}

function getCurrentRoom() {
    return axios.init()
        .then(res => {
            return res.data
        })
        .catch(printErrors)
}

function getGraph() {
    return axios.getGraph()
        .then(res => {
            const graph = parseGraph(res.data)
            return graph
        }).catch(printErrors)
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
    // console.log("adding room...")
    //If called in startCheck()
    if (!previousRoomId) {
        return axios.addRoom(newRoom)
            .then(res => {
                // console.log("hit", res.data)
                return parseGraph(res.data)
            })
            .catch((err) => {
                // console.log(Object.keys(err), "add room error")
                return reloadGraph()
            });
    } else {
        // console.log("adding room after move")
        return axios.addRoom({
            ...newRoom,
            ["room_" + oppositeDirection[directionMoved]]: previousRoomId
        })
            .then(() => {
                // console.log("hit", res.data)

                // Everything between here and catch() occurs
                // If The newRoom does not exist
                return axios.updateRoom({
                    room_id: previousRoomId,
                    ["room_" + directionMoved]: newRoom.room_id
                });
            })
            .then(res => {
                // console.log("hit", res.data)
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
                // console.log(Object.keys(err), "add room error")
                return parseGraph(res.data);
            });
    }
}

function printErrors(error) {
    // console.log(error)
    throw error
}


function parseGraph(arr) {
    const graph = {}
    if (arr.length !== 0) {
        // console.log("parseGraph array", arr, graph)
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
        // console.log(graph)
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
    // console.log(room, "parse room data")

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

    return request
}

module.exports = traversal