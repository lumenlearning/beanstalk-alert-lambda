# Purpose

This is an AWS Lambda function in Node.js used to notify a Slack channel
on Beanstalk messages.

# Usage

The following environment variables must be provided to the Lambda function:

- `SLACK_HOOK_PATH`: This is everything after the Slack hook api hostname,
including the initial "/".
- `SLACK_CHANNEL`: The channel to post messages into.
- `BEANSTALK_ENV`: This should be "Production", "Staging", etc.

# Sample test message

This is an example of data that is sent to the Lambda function by AWS:

    {
      "Records": [
        {
          "EventSource": "aws:sns",
          "EventVersion": "1.0",
          "EventSubscriptionArn": "arn:aws:sns:us-west-2:725843923591:ElasticBeanstalkNotifications-Environment-lumom-stg:7bc04b46-fe90-44fe-bf61-04eb90e00392",
          "Sns": {
            "Type": "Notification",
            "MessageId": "111",
            "TopicArn": "arn:aws:sns:us-west-2:725843923591:ElasticBeanstalkNotifications-Environment-goldilocksStg-env",
            "Subject": "AWS Elastic Beanstalk Notification - New application version was deployed to running EC2 instances",
            "Message": "Timestamp: Thu Feb 16 2017\nMessage: Lambda Function Test: New application version was deployed to running EC2 instances.\n\nEnvironment: goldilocksStg-env\nApplication: goldilocks-stg\n\nEnvironment URL: http://goldilocksstg-env.us-west-2.elasticbeanstalk.com\nRequestId: 222\nNotificationProcessId: 333",
            "Timestamp": "2017-02-016T00:00:00.000Z",
            "SignatureVersion": "1",
            "Signature": "goldilocks-test",
            "SigningCertUrl": "https://sns.us-east-1.amazonaws.com/...",
            "UnsubscribeUrl": "https://sns.us-east-1.amazonaws.com/...",
            "MessageAttributes": {}
          }
        }
      ]
    }
