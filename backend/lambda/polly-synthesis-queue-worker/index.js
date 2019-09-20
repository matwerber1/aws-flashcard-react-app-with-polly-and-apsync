if (process.env.AWS_SAM_LOCAL) {
  AWS = require('aws-sdk');
  } else {
  // Only run AWS X-Ray when NOT running AWS SAM Local
  AWSXRay = require('aws-xray-sdk-core');
  AWS = AWSXRay.captureAWS(require('aws-sdk'));
}

const AppSyncHelper = require('appsync-flashcard-helper');
const polly = new AWS.Polly();
const sqs = new AWS.SQS();

const POLLY_OUTPUT_BUCKET = process.env.POLLY_OUTPUT_BUCKET;
const POLLY_SNS_TOPIC = process.env.POLLY_SNS_TOPIC;
const APPSYNC_ENDPOINT = process.env.APPSYNC_ENDPOINT;
const ACTIONS = {
    CREATE_CARD: 'createCard',
    UPDATE_CARD: 'updateCard'
};

var appSyncClient = new AppSyncHelper({
  url: APPSYNC_ENDPOINT,         
  region: process.env.AWS_REGION,      
  auth_type: 'AWS_IAM',   
  accessKey:  process.env.AWS_ACCESS_KEY_ID,    
  secretKey: process.env.AWS_SECRET_ACCESS_KEY,   
  sessionToken: process.env.AWS_SESSION_TOKEN
});


//------------------------------------------------------------------------------
exports.handler = async (event, context) => {

  console.log(`Event: ${JSON.stringify(event, null, 2)}`);

  for (var r of event.Records) {
    try {
      var { card_id, back_text } = JSON.parse(r.body);
      var action = r.messageAttributes.action.stringValue;
      switch (action) {
        case ACTIONS.CREATE_CARD:
          var back_audio_uri = await submitBackTextToPolly(back_text);
          await updateBackAudioUriInTable(card_id, back_audio_uri);
          break;
        case ACTIONS.UPDATE_CARD:
          break;
        default:
          console.log(`Unspported action: ${action}`);  
      }
      await deleteMessageFromQueue(r.receiptHandle, r.eventSourceARN);
    }
    catch (err) {
      console.log('Error: ', err.message);
    }
    finally {
      return `Successfully processed ${event.Records.length} messages.`;
    }
  }
};


//------------------------------------------------------------------------------
// The event source ARN is our SQS ARN. We parse the ARN to get the queue name 
function getQueueUrlFromQueueArn(arn) {
    var accountId = arn.split(":")[4];
    var queueName = arn.split(":")[5];
    var queueUrl = sqs.endpoint.href + accountId + '/' + queueName;
    return queueUrl;
}


//------------------------------------------------------------------------------
async function deleteMessageFromQueue(receiptHandle, queueArn) {
  console.log('Deleting message from SQS queue...');
  var queueUrl = getQueueUrlFromQueueArn(queueArn);
  var params = {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle
    };
  await sqs.deleteMessage(params).promise();
  console.log('Message deleted.');
  return;
}

//------------------------------------------------------------------------------
async function submitBackTextToPolly(back_text) {

    back_text = `
        <speak><amazon:domain name="news">
            ${back_text}
        </amazon:domain></speak>
    `;
    var params = {
        OutputFormat: 'mp3',
        OutputS3BucketName: POLLY_OUTPUT_BUCKET,
        Text: back_text,
        VoiceId: 'Matthew',
        Engine: 'neural',
        LanguageCode: 'en-US',
        OutputS3KeyPrefix: 'flashcards/',
        SnsTopicArn: POLLY_SNS_TOPIC,
        TextType: 'ssml'
    };
    console.log('Creating Polly speech synthesis task...');
    var response = await polly.startSpeechSynthesisTask(params).promise();
    console.log('Synthesis task submitted:\n' + JSON.stringify(response));
    return response.SynthesisTask.OutputUri;
}


//------------------------------------------------------------------------------
async function updateBackAudioUriInTable(card_id, back_audio) {

  var updateVariables = {
    card_id: card_id, 
    back_audio: back_audio
  };
  console.log('Sending mutation to update card...');
  var response = await appSyncClient.updateCard(updateVariables);
  console.log('Mutation response: ', JSON.stringify(response, null, 2));
}
