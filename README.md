# black-pearl

## mining/
All mining functionality is container within the `mining/` folder.
`master.js` runs on the main process, orchestrates/communicates with all of the workers, and handles communication to and from Lambda's API.
`worker.js` runs on a child process and is where the actual mining takes place- the master launches however many mining child processes as you have CPU cores (minus one for the main process).
`router.js` is an express router with endpoints with which you can control the mining process.

## rateLimitedAxios.js
The Lambda API has a cooldown. :\
Use the axios exported from rateLimitedAxios.js which abstracts away the cooldown handling.
It also hydrates all axios requests with your Lambda API key in the header and sets the Content-Type.

## Lambda API /init Response
```
{
    room_id: 63,
    title: 'A misty room',
    description: 'You are standing on grass and surrounded by a dense mist. You can barely make out the exits in any direction.',
    coordinates: '(60,64)',
    elevation: 0,
    terrain: 'NORMAL',
    players: [ 'player123' ],
    items: [],
    exits: [ 'n', 's', 'w' ],
    cooldown: 1,
    errors: [],
    messages: []
}
```

## Lambda API /move Response
```
{
    room_id: 20,
    title: 'A misty room',
    description: 'You are standing on grass and surrounded by a dense mist. You can barely make out the exits in any direction.',
    coordinates: '(60,63)',
    elevation: 0,
    terrain: 'NORMAL',
    players: [],
    items: [],
    exits: [ 'n', 's', 'e', 'w' ],
    cooldown: 15,
    errors: [],
    messages: [ 'You have walked south.' ]
}
```
