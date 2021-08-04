import * as cdk from '@aws-cdk/core';
import * as nodeLambda from '@aws-cdk/aws-lambda-nodejs'
import * as lambda from '@aws-cdk/aws-lambda';
import * as sns from '@aws-cdk/aws-sns';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as sqs from '@aws-cdk/aws-sqs';
import * as lambdaEventSource from '@aws-cdk/aws-lambda-event-sources';
import {Duration} from "@aws-cdk/core";

export class PassportAppointmentNotifierStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: pass these in as parameters
    const notificationPhoneNumber = ''
    const notificationEmail = ''
    const twilioSecretName = '';
    const twilioSecretFullArn = '';

    const availableAppointmentsTopic = new sns.Topic(this, 'available-appointments', {
      displayName: 'Available Appointments Topic'
    });

    const textMessageQueue = new sqs.Queue(this, 'textMessageQueue', {
      deadLetterQueue: {
        queue:  new sqs.Queue(this, 'textMessageDLQ'),
        maxReceiveCount: 2
      }
    });

    // availableAppointmentsTopic.addSubscription(new subscriptions.SmsSubscription(notificationPhoneNumber, {}));
    availableAppointmentsTopic.addSubscription(new subscriptions.EmailSubscription(notificationEmail, {}));
    availableAppointmentsTopic.addSubscription(new subscriptions.SqsSubscription(textMessageQueue, {}));

    const passportAppointmentNotifier = new lambda.NodejsFunction(this, 'passportAppointmentNotifier', {
      entry: 'lib/passport-appointment-notifier.ts', // accepts .js, .jsx, .ts and .tsx files
      handler: 'handler', // defaults to 'handler'
      environment: {
        AVAILABLE_APPOINTMENTS_SNS_TOPIC_ARN: availableAppointmentsTopic.topicArn,
      }
    });

    const twilioApiSecret = secretsmanager.Secret.fromSecretAttributes(this, 'importedTwilioApiSecret', {
      secretCompleteArn: twilioSecretFullArn,
    });

    const textMessageHandler = new lambda.NodejsFunction(this, 'textMessageHandler', {
      entry: 'lib/text-message-handler.ts', // accepts .js, .jsx, .ts and .tsx files
      handler: 'handler', // defaults to 'handler'
      environment: {
        TWILIO_SECRET_NAME: twilioSecretName,
      },
      timeout: Duration.seconds(10)
    });

    textMessageQueue.grantConsumeMessages(textMessageHandler);
    textMessageHandler.addEventSource(new lambdaEventSource.SqsEventSource(textMessageQueue));
    twilioApiSecret.grantRead(textMessageHandler);

    const passportAppointmentNotifierTarget = new targets.LambdaFunction(passportAppointmentNotifier, {
      retryAttempts: 1, // Optional: set the max number of retry attempts
    })

    availableAppointmentsTopic.grantPublish(passportAppointmentNotifier);


    const scheduledEvent = new events.Rule(this, 'ScheduleRule', {
      schedule: events.Schedule.rate(Duration.minutes(2)),
      targets: [passportAppointmentNotifierTarget],
    });

    const layer = lambda.LayerVersion.fromLayerVersionArn(this, 'chrome-aws-lambda-layer', 'arn:aws:lambda:us-west-2:764866452798:layer:chrome-aws-lambda:24');

  }
}
