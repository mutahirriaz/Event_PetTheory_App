import { EventBridgeEvent, Context } from 'aws-lambda';
import * as AWS from 'aws-sdk'
import {randomBytes} from 'crypto'
const dynamoClient = new AWS.DynamoDB.DocumentClient();

export type PayloadType = {
    operationSuccessful: boolean,
    SnsMessage?: string,
}

export const handler = async (event: EventBridgeEvent<string, any>, context: Context) => {

    const returningPayload: PayloadType = { operationSuccessful: true };


    try{

        if(event["detail-type"] === "petForm"){

            const params = {
                TableName: process.env.PET_EVENTS || "",
                Item: {
                    id: randomBytes(16).toString("hex"),
                    name: event.detail.name,
                    description: event.detail.description,
                },
            };
            await dynamoClient.put(params).promise();
            returningPayload.SnsMessage = `Hello ${event.detail.name}! ${event.detail.description}.`
            
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
