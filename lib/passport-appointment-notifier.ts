import { parse } from 'node-html-parser';
import qs from 'qs';
import { format, addDays } from 'date-fns'
const axios = require('axios');
const AWS = require('aws-sdk')
const sns = new AWS.SNS();

const TRAVEL_PLANS_URL = 'https://passportappointment.travel.state.gov/appointment/new/travelplans'
const FIND_AGENCIES_URL = 'https://passportappointment.travel.state.gov/appointment/new/findclosestagencies'
const snsTopicARN = process.env.AVAILABLE_APPOINTMENTS_SNS_TOPIC_ARN;


exports.handler = async function() {
    const requestedTravelDate = format(addDays(new Date().setHours(0,  0, 0, 0), 3), 'M/dd/yyyy HH:MM:SS aa');
    const locationLat = '32.7243452';
    const locationLong = '-117.2318452';
    const tokens = await axios.get(TRAVEL_PLANS_URL)
        .then(function (response) {
            const root = parse(response.data);
            return {
                headerXSRFToken: response.headers['set-cookie'],
                domXSRFToken: root.querySelector('input[name=__RequestVerificationToken]').attrs['value']
            }
        })
    const data = {
        'latitude': locationLat,
        'longitude': locationLong,
        'dateTravel': requestedTravelDate,
        'dateVisaNeeded': '',
        '__RequestVerificationToken': tokens.domXSRFToken
    };
    const options = {
        method: 'POST',
        headers: {
            'cookie': tokens.headerXSRFToken,
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'accept': 'application/json'
        },
        data: qs.stringify(data),
        url: FIND_AGENCIES_URL,
    };
    const agencies = await axios(options).then(function (response) {
        return response.data;
    });

    const availableAgencies = agencies.filter((agency) => {return agency.IsAvailable === true});

    if (availableAgencies.length > 0){
        const availableAgencyNames = availableAgencies.map((agency) => agency.Name);
        const message = "Theres an appointment at the following offices: " + availableAgencyNames.toString()
        const params = {
            Message: message,
            TopicArn: snsTopicARN
        };

        await sns.publish(params).promise();
    }

};
