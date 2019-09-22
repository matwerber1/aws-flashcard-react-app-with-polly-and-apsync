const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const polly = new AWS.Polly();
const sqs = new AWS.SQS();
const AppSyncHelper = require('appsync-flashcard-helper');
const appSyncClient = getAppSyncHelper();

const ACTIONS = {
    CREATE_CARD: 'createCard',
    UPDATE_CARD: 'updateCard'
};


//------------------------------------------------------------------------------
exports.handler = async (event, context) => {

  console.log(`Event: ${JSON.stringify(event, null, 2)}`);

  for (var r of event.Records) {
    try {
      var { card_id, front_text, back_text } = JSON.parse(r.body);
      var polly_text = `${front_text}<break time="4s" />${back_text}`;
      var action = r.messageAttributes.action.stringValue;
      switch (action) {
        case ACTIONS.CREATE_CARD:
          await submitCardTextToPolly(card_id, polly_text);
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
async function submitCardTextToPolly(card_id, raw_text) {

  var final_text = `
      <speak><amazon:domain name="news">
          ${raw_text}
      </amazon:domain></speak>
  `;
  var params = {
      OutputFormat: 'mp3',
      OutputS3BucketName: process.env.POLLY_OUTPUT_BUCKET,
      Text: final_text,
      VoiceId: 'Matthew',
      Engine: 'neural',
      LanguageCode: 'en-US',
      OutputS3KeyPrefix: `flashcards/${card_id}`,
      SnsTopicArn: process.env.POLLY_SNS_TOPIC,
      TextType: 'ssml'
  };
  console.log('Creating Polly speech synthesis task...');
  var response = await polly.startSpeechSynthesisTask(params).promise();
  console.log('Synthesis task submitted:\n' + JSON.stringify(response));
  
  await updateCardAudioUri(
    card_id,
    response.SynthesisTask.TaskId,
    response.SynthesisTask.OutputUri
  );
  
  return;
}


//------------------------------------------------------------------------------
async function updateCardAudioUri(card_id, task_id, output_uri) {

  var updateVariables = {
    card_id: card_id, 
    audio_uri: output_uri,
    audio_task_id: task_id,
    audio_status: "SYNTHESIS_IN_PROCESS"
  };
  console.log('Sending mutation to update card...');
  var response = await appSyncClient.updateCard(updateVariables);
  console.log('Mutation response: ', JSON.stringify(response, null, 2));
}


//------------------------------------------------------------------------------
function getAppSyncHelper() {
  return new AppSyncHelper({
    url: process.env.APPSYNC_ENDPOINT,         
    region: process.env.AWS_REGION,      
    auth_type: 'AWS_IAM',   
    accessKey:  process.env.AWS_ACCESS_KEY_ID,    
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,   
    sessionToken: process.env.AWS_SESSION_TOKEN
  });
}