//TODO: This file is going to get big fast- Break it up into multiple files with a sensible file structure
//TODO: Use PixiJS's scale functionality in conjunction with window dimensions/resize function to increase responsiveness
//      IE. Make sprites etc bigger on mobile and smaller on desktop


const canvas = document.getElementById(`mycanvas`);

//Make height and width of canvas equal to the the window's size
let _w = window.innerWidth;
let _h = window.innerHeight;

//Instantiate PixiJS application with responsive settings
const app = new PIXI.Application({
    view: canvas,
    width: _w,
    height: _h,
    resolution: window.devicePixelRatio,
    autoDensity: true
})

//Handle window resizing
window.addEventListener(`resize`, resize)
function resize() {
    _w = window.innerWidth;
    _h = window.innerHeight;
    app.renderer.resize(_w, _h);
}

console.log(PIXI.utils.TextureCache);

//Load Game Assets
const loader = PIXI.Loader.shared;
loader.add([{
        name: `blockNormal`,
        url: `blockNormal.png`,
        crossOrigin: ``
    }, {
        name: `blockLocation`,
        url: `blockLocation.png`,
        crossOrigin: ``
    }, {
        name: `blockDirButton`,
        url: `blockDirButton.png`,
        crossOrigin: ``
    }])
    //Connect Load Lifecycle Hooks
    .on(`load`, handleLoadAsset)
    .on(`error`, handleLoadError)
    .on(`progress`, handleLoadProgress)
    .load(handleLoadComplete)

//Load Lifecycle Hooks
function handleLoadError() {
    console.log(`Load Error`)
}
function handleLoadAsset() {
    console.log(`Asset Loaded`)
}
function handleLoadProgress(loader, resource) {
    console.log(`${loader.progress} % loaded`)
}
function handleLoadComplete() {
    const req = [
        fetch(`http://localhost:8000/player/status`, {
            method: `get`
        }),
        fetch(`http://localhost:8000/traversal/init`, {
            method: `get`
        }),
        fetch(`http://localhost:8000/rooms/map-graph`, {
            method: `get`
        })
    ]
    Promise.all(req)
        .then(res => Promise.all(res.map(r => r.json())))
        .then(res => {
            //Establish "Global" Variables Needed
            console.log(PIXI.loader.resources)
            let playerStatus = res[0]
            let currentRoom = res[1]
            let currentCoordinates = currentRoom.coordinates.replace(/\(|\)/g, ``).split(`,`).map(s => parseInt(s))
            console.log(currentRoom, `Currently in Room ${currentCoordinates[1]} ${currentCoordinates[0]}`)
            let lastRoom = null
            let lastCoordinates = null
            let {
                yCoords,
                xCoords,
                mapGraph
            } = res[2]

            //Create PIXI Container
            const container = new PIXI.Container()
            app.stage.addChild(container)

            //Create Map Graph Textures and Sprites
            //The Map Graph is accessible via each room's y/x coordinates:
            //mapGraph[y][x]
            let yCoord = Math.max(...yCoords)
            const minY = Math.min(...yCoords)
            while (yCoord >= minY) {
                for (const xCoord in mapGraph[yCoord]) {
                    //The texture and sprite for each room is saved in the mapGraph
                    //Change texture depending on a conditional
                    //Only texture different as of this point in development is the current location
                    if (currentRoom.room_id === mapGraph[yCoord][xCoord].room_id) {
                        console.log(`Location Texture on ${yCoord} ${xCoord}`)
                        mapGraph[yCoord][xCoord].pixi = {
                            texture: PIXI.loader.resources.blockLocation.texture
                        }
                    } else {
                        mapGraph[yCoord][xCoord].pixi = {
                            texture: PIXI.loader.resources.blockNormal.texture
                        }
                    }
                    mapGraph[yCoord][xCoord].pixi.sprite = new PIXI.Sprite(mapGraph[yCoord][xCoord].pixi.texture)
                    //Ensure the sprite location is based on its center-most point
                    mapGraph[yCoord][xCoord].pixi.sprite.anchor.x = 0.5
                    mapGraph[yCoord][xCoord].pixi.sprite.anchor.y = 0.5
                    //Add the sprite to the container
                    container.addChild(mapGraph[yCoord][xCoord].pixi.sprite)
                }
                yCoord--
            }

            //Add Directional Button Instructions
            const directionInstructionsStyle = new PIXI.TextStyle({
                fill: `#fefefefe`,
                fontFamily: `\`Courier New\`, Courier, monospace`,
                fontWeight: `bold`
            });
            const directionInstructions = new PIXI.Text('Want to move? Click a direction!', directionInstructionsStyle)
            container.addChild(directionInstructions)

            //Setup N/E/S/W Buttons
            const buttonTexture = PIXI.loader.resources.blockDirButton.texture
            let directions = {
                n: null,
                s: null,
                e: null,
                w: null
            }
            Object.keys(directions).forEach(direction => {
                const button = new PIXI.Sprite(buttonTexture)
                button.anchor.x = 0.5
                button.anchor.y = 0.5
                button.interactive = true
                button.cursor = `pointer`
                //Hide direction buttons that don't have exits
                if(currentRoom.exits.includes(direction)) {
                    button.visible = true
                } else {
                    button.visible = false
                }
                // N/E/S/W Button Event Listener
                button.on(`click`, (event) => {
                    fetch(`http://localhost:8000/traversal/move`, {
                            method: `post`,
                            headers: {
                                [`Content-Type`]: `application/json; charset=UTF-8`
                            },
                            body: JSON.stringify({
                                direction
                            })
                        })
                        .then(res => res.json())
                        .then(res => {
                            //Update the last room
                            lastRoom = currentRoom
                            lastCoordinates = lastRoom.coordinates.replace(/\(|\)/g, ``).split(`,`).map(s => parseInt(s))
                            //Update the current room
                            currentRoom = res
                            //Update current coordinates
                            currentCoordinates = res.coordinates.replace(/\(|\)/g, ``).split(`,`).map(s => parseInt(s))
                            console.log(`Moved ${direction} Success ${lastCoordinates[1]}, ${lastCoordinates[0]} to ${currentCoordinates[1]}, ${currentCoordinates[0]}`)
                            //Swap textures on the current room and last room
                            mapGraph[lastCoordinates[1]][lastCoordinates[0]].pixi.texture = PIXI.loader.resources.blockNormal.texture
                            mapGraph[lastCoordinates[1]][lastCoordinates[0]].pixi.sprite.texture = mapGraph[lastCoordinates[0]][lastCoordinates[1]].pixi.texture
                            mapGraph[currentCoordinates[1]][currentCoordinates[0]].pixi.texture = PIXI.loader.resources.blockLocation.texture
                            mapGraph[currentCoordinates[1]][currentCoordinates[0]].pixi.sprite.texture = mapGraph[currentCoordinates[1]][currentCoordinates[0]].pixi.texture
                            //Hide direction buttons that do not have exits
                            Object.keys(directions).forEach(dir => {
                                if(currentRoom.exits.includes(dir)) {
                                    directions[dir].visible = true;
                                } else {
                                    directions[dir].visible = false;
                                }
                            })
                        }).catch(err => console.log(err))
                })

                //Add text to buttons
                const style = new PIXI.TextStyle({
                    fill: `#68bb42`,
                    fontFamily: `\`Courier New\`, Courier, monospace`,
                    fontWeight: `bold`
                });
                const text = new PIXI.Text(direction.toUpperCase(), style)
                button.addChild(text)

                //Add button to directions dictionary
                directions[`${direction}`] = button;
                //Add button to the container
                container.addChild(button)
            })

            //Initialize and Define Animation Loop
            app.ticker.add(animate)
            //These middlepoints are used to center the room graph
            let middleX = median(xCoords)
            let middleY = median(yCoords)

            //app.renderer.screen.width and app.renderer.screen.height are used in the animation loop
            //Because if the window is resize, this way the asset's position is adjusted appropriately
            function animate() {

                //Move Map Items To The Proper Locations
                for (const yCoord in mapGraph) {
                    for (const xCoord in mapGraph[yCoord]) {
                        //If East
                        if (xCoord > middleX) {
                            let xDifference = xCoord - middleX
                            mapGraph[yCoord][xCoord].pixi.sprite.x = app.renderer.screen.width / 2 + xDifference * 43
                        } else {
                            //Else West
                            let xDifference = middleX - xCoord
                            mapGraph[yCoord][xCoord].pixi.sprite.x = app.renderer.screen.width / 2 - xDifference * 43
                        }
                        //If South
                        if (yCoord < middleY) {
                            let yDifference = yCoord - middleY
                            mapGraph[yCoord][xCoord].pixi.sprite.y = app.renderer.screen.height / 2 - yDifference * 26
                        } else {
                            //Else North
                            let yDifference = middleY - yCoord
                            mapGraph[yCoord][xCoord].pixi.sprite.y = app.renderer.screen.height / 2 + yDifference * 26
                        }
                    }
                }

                // Move N/E/W/S Buttons To Proper Location
                for (const direction in directions) {
                    //Define offsets from the center of the N/E/W/S controller
                    //For each button so they are in a sensible location (N, S, E, or W)
                    const yOffsetLookup = {
                        s: 50,
                        e: 0,
                        n: -50,
                        w: 0
                    }
                    const xOffsetLookup = {
                        s: 0,
                        e: 50,
                        n: 0,
                        w: -50
                    }
                    directions[direction].x = app.renderer.screen.width / 2 + 550 + xOffsetLookup[direction]
                    directions[direction].y = app.renderer.screen.height / 2 + 350 + yOffsetLookup[direction]
                
                    directionInstructions.x = app.renderer.screen.width / 2
                    directionInstructions.y = app.renderer.screen.height / 2 + 400
                }
            }
        })
        .catch(function (error) {
            console.log(`Request failed`, error);
        });
}

// Helper To Get Median Number
// Needed to get median x and y grid locations
// To do the math to center the map layout on the canvas
function median(values) {
    values = [...new Set(values)]
    if (values.length === 0) return 0

    values.sort(function (a, b) {
        return a - b
    })

    var half = Math.floor(values.length / 2)

    if (values.length % 2)
        return values[half]
    return Math.floor((values[half - 1] + values[half]) / 2.0)
}