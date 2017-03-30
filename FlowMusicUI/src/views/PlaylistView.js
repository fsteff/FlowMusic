import React, { Component } from 'react';
import Central from '../data/Central.js';
import '../css/PlaylistView.css';

class PlaylistView extends Component{
    render() {
        //const playlist = Central.getPlayer().playlist.songs;
        //const songs = <p>{playlist.toString()}</p>
        return (
            <div className="PlaylistView">
                Playlist

            </div>
        );
    }
}

export default PlaylistView;