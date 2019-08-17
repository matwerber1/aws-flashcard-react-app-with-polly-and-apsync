/*
    Function: ddb-stream-processor
    
    Receive stream of changes to Flashcard table and:  

    * For INSERTs, submit card to Polly synthesis queue if card has back text. 
    * For UPDATEs, submit card to Polly queue if back text changed or added. 
    * For DELETEs, delete back text audio from S3 (if it exists)

*/
const AWS = require("aws-sdk");
const sqs = new AWS.SQS();
const s3 = new AWS.S3(); 
const POLLY_SQS_QUEUE = process.env.POLLY_SQS_QUEUE;

exports.handler = async (event, context) => {
  
    //console.log('Received event:', JSON.stringify(event));
    for (const record of event.Records) {
        console.log(record.eventID);
        console.log(record.eventName);
        console.log('DynamoDB Record: %j', record.dynamodb);
        if (record.eventName === 'INSERT') {
            if (record.dynamodb.NewImage.hasOwnProperty('back_text')) {
                var back_text = record.dynamodb.NewImage.back_text.S;
                var card_id = record.dynamodb.Keys.card_id.S;
                await submitCardTextToPolly(card_id, back_text);
            }
            else {
                console.log('Record does not have required "back_text" key. Skipping audio synthesis.');
            }
        }
    }
    return `Successfully processed ${event.Records.length} records.`;
};


async function submitCardTextToPolly(action, card_id, back_text) {
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