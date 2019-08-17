var AWS = require("aws-sdk");
var polly = new AWS.Polly();

console.log('Loading function');

const OUTPUT_BUCKET = 'werberm-sandbox';

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    return `Done!`;
};
