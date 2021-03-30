import { EventBridgeEvent, Context } from 'aws-lambda';
import * as AWS from 'aws-sdk'
import {randomBytes} from 'crypto'
const dynamoClient = new AWS.DynamoDB.DocumentClient();

export type PayloadType = {
    operationSuccessful: boolean,
    SnsMessage?: string,
    customerEmail?:string
}

export const handler = async (event: EventBridgeEvent<string, any>, context: Context) => {

    const returningPayload: PayloadType = { operationSuccessful: true };


    try{

        if(event["detail-type"] === "petForm"){

            const params = {
                TableName: process.env.PET_EVENTS || "",
                Item: {
                    id: randomBytes(16).toString("hex"),
                    email: event.detail.email,
                    phoneNo: event.detail.phoneNo,
                    inputOne: event.detail.inputOne,
                    inputTwo: event.detail.inputTwo,
                },
            };
            await dynamoClient.put(params).promise();
            returningPayload.SnsMessage = "Hello! We recieved your form and we want to tell you that you don't have to worry.Your pet is fine."
            returningPayload.customerEmail = event.detail.email
            console.log(returningPayload)
        }

        return returningPayload

    }
    catch(err){
        console.log(err)
        returningPayload.operationSuccessful = false;
        return returningPayload;
    }   

};
