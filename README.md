# USA Passport Appointment Fidner
## Background 
My new born son was in need of a passport and after applying and paying for expedited service, the U.S. Dept. of State issued a statement notifying the public of extended processing times for passports. Due to our international travel being sooner than the expected processing times could accomodate, we needed to find an i person apppointmnet at a passport agency near us. Unfortunately because of the statement made by Dept. of State, appointments were hard to come by. Third parties were gathering all appointmentns and selling them for as much as $300 USD. I built this tool to notify me via text message and email when appointments became available so that i didn't have to deal with these third party trolls. **THIS TOOL CANNOT, AND WILL NOT BOOK APPOINTMNETS. THIS WAS BUILT TO NOTIFY MY PERSONALLY OF APPOINTMENT AVAILABILITIES. I STILL HAD TO GO ONLINE AND BOOK MY APPOINTMENT AS NORMAL.** 

## Temporary Removal of Appointment System
**This tool will no longer function as originally intended.** The U.S. Dept of State has disabled their online appointment system due to abuse by thrid parties. Third parties were reserving all avaialable appoinntmnets and selling them to people who actually needed them. This was part of my original reasoning for creating this tool. I wanted to try and beat these third parties and legitmately secure and appointment for myself.
he
See Dept. of State's statement here: https://passportappointment.travel.state.gov/appointment/new

## The Architecture
This tool uses [AWS CDK](https://aws.amazon.com/cdk/) to define AWS resources needed to deploy this application. The basic architecture is as follows:

### Amazon EventBridge
Amazon EventBridge is used to fire off events which will search for appointment availability every 2 minutes. These events will then fire off the AWS Lambda function.

### AWS Lambda
AWS Lambda is used to receive events from EventBridge, and notify via text message and email of available appointments. 

`passport-appointment-notifier.ts` will receive the scheduled event from EventBridge, and attempt to find any appointments available at the specified passport agency locations. If there are apppointments, then a notification is sent to the "Available Appointments" SNS topic. 

`text-message-handler.ts` is used to relay available appointments via text message. This lambda is triggered by the "Available Appointments" SNS topic. This lambda integrates with a twilio accounnt to send SMS messages. 

### Amazon SES
Amazon SES is used to convey a basic email to a specified email notifying it of available appointments

### Amazon SNS
Amazon SNS is used to fan out available appointment notifications to the various lambda destinations. 

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
