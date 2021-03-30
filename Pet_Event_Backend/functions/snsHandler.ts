import {PayloadType} from './dynamo';
import { SNS,SES } from 'aws-sdk';
const sns = new SNS();
var ses = new SES({ region: process.env.OUR_REGION });


export const handler = async (event: PayloadType) => {

    console.log("event>>>>", event);

    try{

        if(event.SnsMessage && event.customerEmail){
             // sending message to TOPIC ARN
            await sns.publish({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Message: event.SnsMessage
            }).promise()
            console.log('message published');

            // sending message to Phone Number
            await sns.publish({
                Message: event.SnsMessage,
                PhoneNumber: process.env.PHONE_NUMBER,
            }).promise()
            console.log('message sent to Phone.no:', process.env.PHONE_NUMBER);

        }

    }
    catch(err){
        console.log(err)
    }

    return { message: "operation successful" }

};