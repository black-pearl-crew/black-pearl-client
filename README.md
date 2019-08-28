# black-pearl

## File Structure
```
/frontend - (React App)
/backend - (Express App)
    /apis - (External and Internal APIs)
    /routers - (Express Routers)
    /util - (Utility Files)
```

## miningWorker.js
This is the child process that is forked off for however many CPU cores your computer has (minus one for the master process).
This is what powers parallel computing of the hash. The workers are controlled in the mining API


## lambdaAxios.js
The Lambda API has a cooldown. :\
Use the axios exported from rateLimitedAxios.js which abstracts away the cooldown handling.
It also hydrates all axios requests with your Lambda API key in the header and sets the Content-Type.

## backendAxios.js
The Lambda API has a cooldown. :\
Use the axios exported from backendAxios.js to communicate with our backend.
It hydrates all axios requests with the Authorization header and sets the Content-Type.

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
