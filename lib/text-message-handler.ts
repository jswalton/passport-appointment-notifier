const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const twilioSecretName = process.env.TWILIO_SECRET_NAME;
const twilioSMSNumber = ''; // TODO: make this configurable

exports.handler = async function(event, context) {

    const twilioAPICredsResponse = await secretsManager.getSecretValue({SecretId: twilioSecretName}).promise()
    const twilioAPICreds = JSON.parse(twilioAPICredsResponse.SecretString)

    const accountSid = twilioAPICreds.account_sid;
    const authToken = twilioAPICreds.auth_token;

    const twilioClient = require('twilio')(accountSid, authToken);

    const phoneNumbers = ['']

    const sqsBody = JSON.parse(event.Records[0].body)

    for (const number of phoneNumbers) {
        await twilioClient.messages.create({
            body: sqsBody.Message, //TODO: be more flexible here
            from: twilioSMSNumber,
            to: number
        });
    }
}
