import React, { useState } from 'react';
import AudioPlayer from './audio-player.js';


const Card = (props) => {

  return (
    <div className="card" >
      <div className="card-content">
        <CardFront frontText={props.front_text || '<no front text>'} />
        <CardBack backText={props.back_text || '<no back text>'} /> 
        <AudioPlayer audio={props.audio_uri} />
      </div>
    </div>
  );
};


const CardFront = (props) => {

  const [isEditMode, setEditMode] = useState(false);

  const toggleEditMode = () => {
    setEditMode(!isEditMode);
    console.log('CardFront editable = ', isEditMode);
  }

  if (isEditMode) {
    return (
      <div>
        <input onDoubleClick={() => toggleEditMode()}
          type="text"
          defaultValue={props.frontText}
        />
      </div>
    );
  }
  else {
    return (
      <div className="card-front" onDoubleClick={() => toggleEditMode()}>
        {props.frontText}
      </div>
    );
  }
};

const CardBack = (props) => {
    return (
        <div className="card-back">
            {props.backText}
        </div>
    );
};

export default Card;