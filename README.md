# aws-amplify-quiz-app

This is a work in process, not currently ready / working. 


# Architecture

1. React app - hosts front-end to interact with flashcards (view, edit, delete, list)

2. Flashcard Table - Amazon DynamoDB stores our flashcards with the following schema:

    ```json
    {
        "card_id": "string",
        "front_text": "string",
        "back_text": "string",
        "back_audio": "string",
        "back_audio_ready": "string"
    }
    ```

    The **back_audio** is the full S3 URI to a speech audio file synthesized by Amazon Polly from the card's back text. 

    Since back audio is created asynchronously when a flashcard is created/edited, the **back_audio_ready** attribute indicates whether this asynchronous synthesis is complete. 

3. GraphQL API - Amazon AppSync hosts a GraphQL API that is configured to handle all queries and mutations against the Amazon DynamoDB flashcard table. Rather than interact directly with the DynamoDB table, changes to flashcards should be pushed through this API; note - you could technically make changes directly to the DynamoDB table but doing so means you would not be able to take advantage of AppSync's subscriptions capability (not currently used in this app) and also means you'd have to use two different CRUD mechanisms (e.g. straight DynamoDB API calls as well as GraphQL).

4. **Amazon Cognito User Pool** - a Cognito User Pool (CUP) acts as our application's identity provider.

5. **Amazon Cognito Identity Pool** - a Cognito Identity Pool (CIP) provides temporary IAM credentials to our authenticated CUP users so that they may interact with our backend AWS resources. 

6. **Flashcard Stream** - An Amazon DynamoDB stream that receives all changes to the flashcard table.

7. **Flashcard Stream Processor** - an AWS Lambda function that reads from the flashcard stream; for new cards or modified back text of existing cards, the function submits a task to an Amazon SQS queue for later synthesis to text by Amazon Polly. For items deleted from DynamoDB, this function deletes it's back text audio file from the **back_audio** path (if applicable).

8. **Polly Synthesis Queue** - this queue receives messages containing details needed for creating an Amazon Polly speech synthesis task for a flashcard's back text. 

9. **Submit Polly Synthesis Function** - this AWS Lambda function reads synthesis jobs from the Polly Synthesis Queue and submits them to Amazon Polly. Upon successful submission, Polly returns the S3 URI that will contain the audio output file. The Lambda function  writes/updates the S3 audio path to **back_audio**  and sets **back_audio_ready** to `false` in the flashcard table. 

10. **Polly Synthesis SNS Topic** - this SNS topic recieves notification mesasages when Polly completes a speech synthesis task. 

11. **Handle Polly SNS Messages Function** - this function is subscribed to the Polly Synthesis SNS topic. When this function receives notification of a successfully-synthesized message, this function sets the **back_audio_ready** attribute to `true` in the flashcard table.