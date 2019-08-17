#aws s3 cp ./appsync/flashcard-schema.graphql s3://werberm-sandbox/appsync/flashcard-schema.graphql
sam build
sam package --output-template packaged.yaml --s3-bucket werberm-sandbox
sam deploy \
    --template-file packaged.yaml \
    --region us-east-1 \
    --capabilities CAPABILITY_IAM \
    --stack-name flashcardApp \
    --parameter-overrides PollyOutputBucket=matwerber.info