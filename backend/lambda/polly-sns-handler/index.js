const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const AppSyncHelper = require('appsync-flashcard-helper');
var appSyncClient = getAppSyncHelper();


//------------------------------------------------------------------------------
exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  for (var r of event.Records) {
    var { taskId, taskStatus } = JSON.parse(r.Sns.Message);
    console.log(`Polly task ${taskId} ended with status ${taskStatus}`);
    var cards = await appSyncClient.getCardIdsByBackAudioTaskId(taskId);
    console.log('cards: \n', JSON.stringify(cards, null, 2));
    for (var c of cards) {
      console.log(`Updating card ${c.card_id} back audio status...`);
      await appSyncClient.updateCard({
        card_id: c.card_id,
        back_audio_status: taskStatus
      });
      console.log('Update complete');
    }
  }

  return `Done!`;
};


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