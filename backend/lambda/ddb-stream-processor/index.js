if (process.env.AWS_SAM_LOCAL) {
  AWS = require('aws-sdk');
  } else {
  // Only run AWS X-Ray when NOT running AWS SAM Local
  AWSXRay = require('aws-xray-sdk-core');
  AWS = AWSXRay.captureAWS(require('aws-sdk'));
}
const sqs = new AWS.SQS();
const POLLY_SQS_QUEUE = process.env.POLLY_SQS_QUEUE;
var validate = require('jsonschema').validate;

const ACTIONS = {
    CREATE_CARD: 'createCard',
    UPDATE_CARD: 'updateCard'
};

//------------------------------------------------------------------------------
exports.handler = async (event, context) => {
  
  var processed_records = 0;
  var skipped_records = 0;

  for (const record of event.Records) {
    try {
      console.log(record.eventID);
      console.log(record.eventName);
      console.log('DynamoDB Record: %j', record.dynamodb);  
      record.dynamodb = getUnmarshalledDynamoDBRecord(record.dynamodb);
      AWSXRay.captureFunc('annotations', function(subsegment){
        subsegment.addAnnotation('Card ID', record.dynamodb.Keys.card_id);
      });
      if (record.eventName === 'INSERT') {
        var newImage = record.dynamodb.NewImage;
        if (!cardSchemaIsValid(newImage)) {
          throw new Error('Invalid card schema');
        }
        else {
          await submitCardBackTextToPolly(
            ACTIONS.CREATE_CARD,
            newImage.card_id,
            newImage.front_text,
            newImage.back_text
          );
        }
      }

      processed_records += 1;
    }
    catch (err) {
      console.log('Error: unable to process record: ', err.message);
      skipped_records += 1;
    }
  }
  return `${processed_records} successfully processed, ${skipped_records} skipped records`;
};

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


//------------------------------------------------------------------------------
function cardSchemaIsValid(card) {

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
    console.log('DynamoDB has schema errors: ', JSON.stringify(errors, null, 2));
    return false;
  }
  else {
      return true;
  }
}


async function submitCardBackTextToPolly(action, card_id, front_text, back_text) {
    /*
        message_type:       string        [required]
        card_id:            string        [required]
        back_text:          string        [required]
        old_audio_s3_path:  string

        message_type: 
            Should be "NEW" or "REPLACE"

        old_audio_s3_path:
            Includes full s3 URI of previous audio file that should be deleted.  
    */
    console.log('Submitting card to Polly synthesis queue...');
    var message_body = JSON.stringify(
        {
            card_id: card_id, 
            front_text: front_text,
            back_text: back_text
        }
    );
    var params = {
        MessageBody: message_body,
        QueueUrl: POLLY_SQS_QUEUE,
        DelaySeconds: 15,
        MessageAttributes: {
          'action': {
            DataType: 'String',
            StringValue: action
          }
        }
    };
    await sqs.sendMessage(params).promise();
    console.log('Card submitted!');
    return;
}