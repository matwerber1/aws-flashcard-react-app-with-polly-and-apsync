import React, { useState } from 'react';
import ReactAudioPlayer from 'react-audio-player';      //https://github.com/justinmc/react-audio-player

const AudioPlayer = (props) => {

    if (props.audio !== undefined) {
        return (
            <ReactAudioPlayer
                src={props.audio}
                controls
            />
        );
    }
    else {
        return null;
    }
};

export default AudioPlayer;