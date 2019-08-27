import React, {useEffect, useState} from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [getRoom,setRoom] = useState(null);
    const [getLoading,setLoading] = useState(false);

    useEffect(() => {
      axios
        .get('http://localhost:8000/traversal/init')
        .then(({data}) => {
            console.log(data)
            setRoom(data);
        })
        .catch(err => console.log(err));
    }, []);

    useEffect(() => {

    }, [getRoom,getLoading])


    const move = (e) => {
      if (!getLoading) {
        setLoading(true);
        axios
          .post('http://localhost:8000/traversal/move',{direction: e.target.id})
          .then(({data}) => {
              setRoom(data);
              setLoading(false);
          })
          .catch(err => console.log(err))
      }
    }

    return (
        <div className="App">
            <div className="map-wrapper">
                <div className="row">
                    {/* <div className="circle circle-basic" src="circle.png" alt="circle">1</div> */}
                    <div className="circle" src="circle.png" alt="circle"></div>
                    {
                      !getLoading && getRoom && getRoom.exits.includes('n') ?
                      <div id="n" className="circle circle-basic circle-exit" src="circle.png" alt="circle" onClick={move}>N</div>
                      : <div className="circle" src="circle.png" alt="circle"></div>
                    }
                    <div className="circle" src="circle.png" alt="circle"></div>
                    {/* <div className="circle circle-basic" src="circle.png" alt="circle">?</div> */}
                </div>
                <div className="row">
                    {/* <div className="circle" src="circle.png" alt="circle"></div> */}
                    {
                      !getLoading && getRoom && getRoom.exits.includes('w') ?
                      <div id="w" className="circle circle-basic circle-exit" src="circle.png" alt="circle" onClick={move}>W</div>
                      : <div className="circle" src="circle.png" alt="circle"></div>
                    }
                    <div className="circle circle-you" src="circle-you.png" alt="circle"></div>
                    {
                      !getLoading && getRoom && getRoom.exits.includes('e') ?
                      <div id="e" className="circle circle-basic circle-exit" src="circle.png" alt="circle" onClick={move}>E</div>
                      : <div className="circle" src="circle.png" alt="circle"></div>
                    }
                    {/* <div className="circle circle-basic" src="circle.png" alt="circle">?</div> */}
                </div>
                <div className="row">
                    <div className="circle" src="circle.png" alt="circle"></div>
                    {/* <div className="circle circle-basic" src="circle.png" alt="circle">?</div> */}
                    {
                      !getLoading && getRoom && getRoom.exits.includes('e') ?
                      <div id="s" className="circle circle-basic circle-exit" alt="circle" onClick={move}>S</div>
                      : <div className="circle" src="circle.png" alt="circle"></div>
                    }
                    {/* <div className="circle circle-basic" src="circle.png" alt="circle">?</div> */}
                    <div className="circle" src="circle.png" alt="circle"></div>
                </div>
            </div>
            {
              getLoading && <h1>Loading...</h1>
            }
            {
              !getLoading && getRoom &&
              <div className="info-wrapper">
                <h1>{getRoom.title}</h1>
                <p>Elevation: {getRoom.elevation}</p>
                <p>Terrain: {getRoom.terrain}</p>
                <p>{getRoom.description}</p>
              </div>
            }
        </div>
    );
}

export default App;
