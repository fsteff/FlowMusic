import React, { Component } from 'react';
import PlayBar from './PlayBar.js';
import '../css/App.css';
import LeftMenu from "./LeftMenu";
import PlaylistView from './PlaylistView.js';

class App extends Component {
  render() {
      return (
      <div className="App">
          <div>
              <LeftMenu/>
              <PlaylistView/>
              <div id="player"></div>
          </div>
          <PlayBar />
      </div>
    );
  }
}

export default App;
