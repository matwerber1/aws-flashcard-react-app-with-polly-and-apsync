const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const validate = require('jsonschema').validate;
const AppSyncHelper = require('appsync-flashcard-helper');
const appSyncClient = getAppSyncHelper();
const sqs = new AWS.SQS();
const s3 = new AWS.S3();

const ACTIONS = {
    CREATE_CARD: 'createCard',
    UPDATE_CARD: 'updateCard'
};

//------------------------------------------------------------------------------
exports.handler = async (event, context) => {
  
  var processed_records = 0;
  var skipped_records = 0;
  var errored_records = 0;

  for (const record of event.Records) {
    try {
      console.log(record.eventID);
      console.log(record.eventName);
      console.log('DynamoDB Record: %j', record.dynamodb);  
      record.dynamodb = getUnmarshalledDynamoDBRecord(record.dynamodb);

      switch (record.eventName) {
        case "INSERT":
          var newCard = record.dynamodb.NewImage;
          await submitCardTextToPollyQueue(ACTIONS.CREATE_CARD, newCard);
          processed_records += 1;
          break;
        
        case "REMOVE":
          var oldCard = record.dynamodb.OldImage;
          await deleteAudioFromS3(oldCard);
          processed_records += 1;
          break;
        
        case "MODIFY":
          var oldCard = record.dynamodb.OldImage;
          var newCard = record.dynamodb.NewImage;
          if (cardTextHasChanged(oldCard, newCard)) {
            await swapOldAudioWithNewPollySynthesis(oldCard, newCard);
          }
          processed_records += 1;
          break;
        
        default:
          throw new Error(`Unsupported event type ${record.eventName}`);
      }
    }
    catch (err) {
      console.log('Error: unable to process record: ', err.message);
      errored_records += 1;
    }
  }
  return `Records: ${processed_records} processed, ${skipped_records} skipped, ${errored_records} errors`;
};


//------------------------------------------------------------------------------
async function swapOldAudioWithNewPollySynthesis(oldCard, newCard) {
  console.log('Deleting old audio and submitting new text to Polly...');
  await deleteAudioFromS3(oldCard);
  await submitCardTextToPollyQueue(ACTIONS.CREATE_CARD, newCard);
  return;
}


//------------------------------------------------------------------------------
function cardTextHasChanged(oldCard, newCard) {

  if (
       (oldCard.back_text !== newCard.back_text)
    || (oldCard.front_text !== newCard.front_text)
  ) {
    console.log("Card text has changed.");
    return true;
  }
  else {
    console.log("Card text has not changed. ");
    return false;
  }

}


//------------------------------------------------------------------------------
// Convert DynamoDB record into Javascript Object
function getUnmarshalledDynamoDBRecord(record) {

  var unmarshalled = record;
  unmarshalled.Keys = AWS.DynamoDB.Converter.unmarshall(record.Keys);
  if (record.hasOwnProperty('NewImage')) {
    unmarshalled.NewImage = AWS.DynamoDB.Converter.unmarshall(record.NewImage);
  }
  if (record.hasOwnProperty('OldImage')) {
    unmarshalled.OldImage = AWS.DynamoDB.Converter.unmarshall(record.OldImage);
  }
  return unmarshalled;
};


function getBucketAndKeyFromS3Uri(uri) {
  var s3_url_regex = /https:\/\/s3.[a-z0-9\-]+.amazonaws.com\//;
  var [bucket, key] = uri.split(s3_url_regex)[1].split(/\/(.+)/);
  return [bucket, key];
}

//------------------------------------------------------------------------------
function validateCardSchema(card) {

  var schema = {
    id: "/Card",
    type: "object",
    properties: {
      card_id: { type: "string" },
      front_text: { type: "string" },
      back_text: { type: "string" }
    },
    required: ['card_id', 'front_text', 'back_text']
  };

  var errors = validate(card, schema).errors;

  if (errors.length > 0) {
    throw new Error('DynamoDB record schema errors: ', JSON.stringify(errors, null, 2));
  }
  else {
    console.log('DynamoDB schema is valid.');
    return;
  }
}


//------------------------------------------------------------------------------
async function deleteAudioFromS3(card) {

  console.log('Preparing to delete audio from S3...');
  if (card.hasOwnProperty('audio_uri')) {
    var [bucket, key] = getBucketAndKeyFromS3Uri(card.audio_uri);
    await s3.deleteObject({
      Bucket: bucket,
      Key: key
    }).promise();
    console.log(`Audio deleted.`);
    await appSyncClient.updateCard({
      card_id: card.card_id,
      audio_status: "DELETED"
    });
  }
  else {
    console.log('Card does not have existing audio... skipping S3 delete.');
  }
  return;
}


//------------------------------------------------------------------------------
async function submitCardTextToPollyQueue(action, card) {

  //validateCardSchema(card);
  console.log('Preparing to submit card text to Polly queue...');

  var message_body = JSON.stringify(
    {
        card_id: card.card_id, 
        front_text: card.front_text,
        back_text: card.back_text
    }
  );
  var params = {
      MessageBody: message_body,
      QueueUrl: process.env.POLLY_SQS_QUEUE,
      DelaySeconds: 5,      // should this be zero? any benefit to > 0?
      MessageAttributes: {
        'action': {
          DataType: 'String',
          StringValue: action
        }
      }
  };
  await sqs.sendMessage(params).promise();
  console.log('Card submitted!');
  await appSyncClient.updateCard({
    card_id: card.card_id,
    audio_status: "QUEUED"
  });
  console.log('Card status set to QUEUED.');

  return;
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