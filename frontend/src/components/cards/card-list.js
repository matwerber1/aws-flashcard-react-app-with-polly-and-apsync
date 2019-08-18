import React, { useState } from 'react';
import Card from './card.js';
import { Connect } from 'aws-amplify-react';
import { graphqlOperation } from 'aws-amplify';
import * as queries from './../../graphql/queries';

const CardList = (props) => {
    var cardList = testCards;
    
    const CardView = ({ cards }) => {
        
        console.log('CardView cards: ' + JSON.stringify(cards));

        return (
            <div>
                <h3>Cards</h3>
                <ul>
                    {cards.map(card => <Card key={card.card_id} {...card} />)}
                </ul>
            </div>
        );
    };

/*

        <div className="card-list">
             <Connect query={graphqlOperation(queries.listTodos)}>
                {({ data: {listTodos}, loading, error }) => {
                    console.log(`listCards: ${JSON.stringify(listTodos)}, loading: ${loading}, error: ${error}`);
                    if (error) return (<h3>Error loading cards</h3>);
                    if (loading || !listTodos) return (<h3>Loading cards...</h3>);
                    return (<div>derp</div>);
                    //return (<CardView cards={listCards.items} />);
                }}
            </Connect>
        </div>

        <div className="card-list">
             <Connect query={graphqlOperation(queries.listCards)}>
                {({ data: {listCards}, loading, error }) => {
                    console.log(`listCards: ${JSON.stringify(listCards)}, loading: ${loading}, error: ${error}`);
                    if (error) return (<h3>Error loading cards</h3>);
                    if (loading || !listCards) return (<h3>Loading cards...</h3>);
                    return (<div>derp</div>);
                    //return (<CardView cards={listCards.items} />);
                }}
            </Connect>
        </div>

        <div className="card-list">
             <Connect query={graphqlOperation(queries.listCards)}>
                {({ data, loading, error }) => {
                    console.log(`listCards: ${JSON.stringify(data)}, loading: ${loading}, error: ${error}`);
                    if (error) return (<h3>Error loading cards</h3>);
                    if (loading || !data) return (<h3>Loading cards...</h3>);
                    return (<div>derp</div>);
                    //return (<CardView cards={listCards.items} />);
                }}
            </Connect>
        </div>

                     <Connect query={graphqlOperation(queries.listCards)}>
                {({ data: {listCards}, loading, error }) => {
                    console.log(`listCards: ${JSON.stringify(listCards)}, loading: ${loading}, error: ${error}`);
                    if (error) return (<h3>Error loading cards</h3>);
                    if (loading || !listCards) return (<h3>Loading cards...</h3>);
                    return (<CardView cards={listCards.items} />);
                }}
            </Connect>
        */

    return (
        <div className="card-list">
 <div className="card-list">
             <Connect query={graphqlOperation(queries.listCards)}>
                {({ data, loading, error }) => {
                    console.log(`listCards: ${JSON.stringify(data)}, loading: ${loading}, error: ${error}`);
                    if (error) return (<h3>Error loading cards</h3>);
                    if (loading || !data) return (<h3>Loading cards...</h3>);
                    return (<div>derp</div>);
                    //return (<CardView cards={listCards.items} />);
                }}
            </Connect>
        </div>
        </div>
    );
};

export default CardList; 

var testCards = [
    {
        card_id: "1",
        front_text: "this is the front",
        back_text: "this is the back"
    },
    {
        card_id: "2",
        front_text: "How many customers does AWS have?",
        back_text: "AWS has millions of active customers every month."
    },
    {
        card_id: "3",
        front_text: "Is AWS growing?",
        back_text: "AWS is a large and rapidly growing business. Q1 2019 revenue for the AWS segment increased 41% y/y to $7.7 billion, making AWS a nearly $31 billion dollar run rate business."
    },
    {
        card_id: "4",
        front_text: "How does AWS's growth compare to other enterprise IT vendors?",
        back_text: "AWS is the fastest enterprise IT vendor to reach a $10 billion run-rate."
    },
    {
        card_id: "5",
        front_text: "How big is the AWS global infrastructure?",
        back_text: "The AWS global infrastructure is comprised of 64 Availability Zones within 21 geographic Regions with announced plans for 12 more Availability Zones and four more Regions in Bahrain, Indonesia, Italy, and South Africa. The global network of AWS Edge locations now consists of 187 Points of Presence (176 Edge Locations and 11 Regional Edge Caches) in 69 cities across 30 countries."
    },
    {
        card_id: "6",
        front_text: "Has AWS ever reduced prices?",
        back_text: "We've reduced prices 73 times since AWS launched in 2006."
    },
    {
        card_id: "7",
        front_text: "What is the status of Amazon’s move off Oracle databases?",
        back_text: "We’re virtually done with our company-wide migration: As of November 1st 2018, the Amazon team shut off the last Oracle data warehouse and Amazon now runs on Amazon Redshift, which is an AWS service. As of the end of 2018, 88% of all databases are off Oracle and running on Amazon DynamoDB and Amazon Aurora. This represents 97% of Amazon’s mission critical databases, which is pretty amazing progress. As of March 2019, the Amazon Fulfillment teams completed 100% of the migration off Oracle. Having gone through moving off Oracle databases ourselves, we have a lot of customers interested in learning from our experience. We’re excited to share that experience so customers can get better price performance from their databases."
    }
];