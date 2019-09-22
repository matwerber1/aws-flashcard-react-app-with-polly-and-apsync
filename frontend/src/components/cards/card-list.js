import React, { useState } from 'react';
import Card from './card.js';
import { Connect } from 'aws-amplify-react';
import { graphqlOperation } from 'aws-amplify';
import * as queries from './../../graphql/queries';

const run_local = false;

const CardList = (props) => {
    
  const CardView = ({ cards }) => { 
    return (
      <div>
        <u><h3>Cards</h3></u>
          {
            cards.length > 0 ?
              cards.map(card => <Card key={card.card_id} {...card} />)
              : "no cards exist" 
          }
      </div>
    );
  };
  
  function RenderCardList() {
    if (run_local === true) {
      var testCards = [
        {
          card_id: "card_1",
          front_text: "this is the front text",
          back_text: "this is the back text"
        }
      ];
      return (
        <CardView cards={testCards} />
      );
    }
    else {
      return (
        <Connect query={graphqlOperation(queries.listCards)}>
          {({ data, loading, error }) => {
            console.log(`${JSON.stringify(data)}, loading: ${loading}, error: ${error}`);
            if (error) return (<h3>Error loading cards</h3>);
            if (loading) return (<h3>Loading cards...</h3>);
            return (<CardView cards={data.listCards.items} />);
          }}
        </Connect>
      );
    }
  }

  return (
    <div className="card-list">
      {RenderCardList()}
    </div>
  );
};

export default CardList; 