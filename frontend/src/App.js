import React from 'react';
import { withAuthenticator } from 'aws-amplify-react';
import CardList from './components/cards/card-list.js';
import AuthDisplay from './components/auth-display/auth-display.js';
import './App.css';
import Amplify from 'aws-amplify';
import awsconfig from './amplify-config.js';
Amplify.configure(awsconfig);


function App(props) {
  return (
    <div className="App">
          <Header />
          <CardList />
          <AuthDisplay {...props} />
    </div>
  );
}

function Header() {
    return (
        <header className="App-header">
            Derp
        </header>
    );
}

export default withAuthenticator(App);