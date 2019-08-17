/*
    Function: submit-polly-synthesis-task
*/
const AWS = require("aws-sdk");
const polly = new AWS.Polly();
const sqs = new AWS.SQS();
const docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const appsync = require('aws-appsync');
const gql = require('graphql-tag');
require('cross-fetch/polyfill');
const POLLY_OUTPUT_BUCKET = process.env.POLLY_OUTPUT_BUCKET;
const POLLY_SNS_TOPIC = process.env.POLLY_SNS_TOPIC;
const FLASHCARD_TABLE = process.env.FLASHCARD_TABLE;        // not used
const APPSYNC_ENDPOINT = process.env.APPSYNC_ENDPOINT;
const SKIP_POLLY = true;
const graphqlClient = configureGraphqlClient();


exports.handler = async (event, context) => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    for (var { receiptHandle, messageId, body, messageAttributes, eventSourceARN} of event.Records) {
        
        console.log(`SQS message ${messageId}:\nBody: ${body}\nAttributes: ${messageAttributes}\n`);
        var accountId = eventSourceARN.split(":")[4];
        var queueName = eventSourceARN.split(":")[5];
        var queueUrl = sqs.endpoint.href + accountId + '/' + queueName;
        var action = messageAttributes.action.stringValue;
        body = JSON.parse(body);
        console.log('card_id: ' + body.card_id);
        await deleteMessageFromQueue(receiptHandle, queueUrl);
    }
    return `Successfully processed ${event.Records.length} messages.`;

};


async function deleteMessageFromQueue(receiptHandle, queueUrl) {
    console.log('Deleting message from SQS queue...');
    var params = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
      };
    await sqs.deleteMessage(params).promise();
    console.log('Message deleted.');
    return;
}

async function synthesizeText(translateText) {

    translateText = `
        <speak><amazon:domain name="news">
            ${translateText}
        </amazon:domain></speak>
    `;

    if (SKIP_POLLY === true) {
        var result = "https://s3.us-east-1.amazonaws.com/werberm-sandbox/flashcards/.d168ca6c-2518-4df7-8a6f-94a1c3ea8147.mp3";
        console.log('Skipping polly, returning test URL: ' + result);
        return result; 
    }
    else {
        var params = {
            OutputFormat: 'mp3',
            OutputS3BucketName: POLLY_OUTPUT_BUCKET,
            Text: translateText,
            VoiceId: 'Matthew',
            Engine: 'neural',                   // not yet in Lambda runtime; need to wait or create Layer with updated aws-sdk
            LanguageCode: 'en-US',
            OutputS3KeyPrefix: 'flashcards/',
            SnsTopicArn: POLLY_SNS_TOPIC,
            TextType: 'ssml'                    // until we have proper SDK for neural, just use text
        };
        
        console.log('Creating Polly speech synthesis task...');
        var response = await polly.startSpeechSynthesisTask(params).promise();
        console.log('Synthesis task submitted:\n' + JSON.stringify(response));
        /* -- EXAMPLE RESPONSE
            {
                "SynthesisTask": {
                    "TaskId": "d168ca6c-2518-4df7-8a6f-94a1c3ea8147",
                    "TaskStatus": "scheduled",
                    "TaskStatusReason": null,
                    "OutputUri": "https://s3.us-east-1.amazonaws.com/werberm-sandbox/flashcards/.d168ca6c-2518-4df7-8a6f-94a1c3ea8147.mp3",
                    "CreationTime": "2019-08-09T14:38:25.239Z",
                    "RequestCharacters": 6,
                    "SnsTopicArn": "arn:aws:sns:us-east-1:544941453660:flashcardApp-PollySynthesisTopic-SJP5C19443G6",
                    "OutputFormat": "mp3",
                    "SampleRate": null,
                    "TextType": "text",
                    "VoiceId": "Matthew",
                    "LanguageCode": "en-US"
                }
            }
        */
        return response.SynthesisTask.OutputUri;
    }
}


async function updateBackAudioInTable(card_id, back_audio) {

    var graphql = `
        mutation UpdateCard {
            updateCard(
                card_id: "${card_id}",
                back_audio: "${back_audio}"
            ) {
                card_id
                back_audio
            }
        }
    `;
    console.log('Calling GraphQL: ' + graphql);
    var mutation = gql(graphql);
    var response = await graphqlClient.mutate({ mutation });
    console.log('Mutation  complete: ' + JSON.stringify(response));
}



function configureGraphqlClient() {
    var graph_params = {
        url: APPSYNC_ENDPOINT,
        region: process.env.AWS_REGION,
        auth: {
            type: 'AWS_IAM',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN
            }
        },
        disableOffline: true
    };
    return new appsync.AWSAppSyncClient(graph_params);
}