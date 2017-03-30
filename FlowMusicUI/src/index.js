import React from 'react';
import ReactDOM from 'react-dom';
import App from './views/App';
import Central from './data/Central.js';
import './css/index.css';





ReactDOM.render(
  <App />,
  document.getElementById('root')
);

Central.getInstance();



