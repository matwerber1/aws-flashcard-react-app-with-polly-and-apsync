if (process.env.AWS_SAM_LOCAL) {
  AWS = require('aws-sdk');
  } else {
  // Only run AWS X-Ray when NOT running AWS SAM Local
  AWSXRay = require('aws-xray-sdk-core');
  AWS = AWSXRay.captureAWS(require('aws-sdk'));
}

var polly = new AWS.Polly();

console.log('Loading function');

const OUTPUT_BUCKET = 'werberm-sandbox';

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    return `Done!`;
};
