import React, { useState } from 'react';
import AudioPlayer from './audio-player.js';


const Card = (props) => {

    //const [frontText, setFrontText] = useState(props.card.front_text);
    //const [backText, setBackText] = useState(props.card.back_text);
    //const [isFlipped, setIsFlipped] = useState(false);

    const [frontText] = useState(props.front_text);
    const [backText] = useState(props.back_text);

    //console.log(props)
    //console.log("isFlipped = " + isFlipped);
    //console.log('card props: ' + JSON.stringify(props, null, 2));
 


    return (
        <div className="card" >
            <div className="card-content">
                <CardFront frontText={frontText || '<no front text>'} />
                <CardBack backText={backText || '<no back text>'} /> 
                <AudioPlayer audio={props.back_audio} />
            </div>
        </div>
    );
};


const CardFront = (props) => {
    return (
        <div className="card-front">
            {props.frontText}
        </div>
    );
};

const CardBack = (props) => {
    return (
        <div className="card-back">
            {props.backText}
        </div>
    );
};

export default Card;