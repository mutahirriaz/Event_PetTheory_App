import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as events from '@aws-cdk/aws-events';
import * as eventsTargets from '@aws-cdk/aws-events-targets';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as sns from '@aws-cdk/aws-sns';
import * as iam from '@aws-cdk/aws-iam';
import * as snsSubscriptions from '@aws-cdk/aws-sns-subscriptions';
import * as stepFunctions from '@aws-cdk/aws-stepfunctions';
import * as stepFunctionsTasks from '@aws-cdk/aws-stepfunctions-tasks';
import { requestTemplate, responseTemplate } from '../utils/appsync-request-response';
import { Rule } from '@aws-cdk/aws-events';

export class PetEventBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const api = new appsync.GraphqlApi(this, "PetApi", {
      name: "PetEventApi",
      schema: appsync.Schema.fromAsset("graphql/schema.gql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY
        },
      },
      xrayEnabled: true,
    });

    const httpDs = api.addHttpDataSource(
      "ds",
      "https://events." + this.region + ".amazonaws.com/",  // This is the ENDPOINT for eventbridge.
      {
        name: "httpDsPetTheory",
        description: "Appsync To EventBridge",
        authorizationConfig: {
          signingRegion: this.region,
          signingServiceName: "events"
        },
      }
    );

    
    const snsTopic = new sns.Topic(this, "petTheory");
    
    // Adding SNS subscribers
    /* subscriber 1 */
    // ref https://docs.aws.amazon.com/cdk/latest/guide/parameters.html
    const email = new cdk.CfnParameter(this, "emailParam", {type: 'String'}) // taking Input
    snsTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(email.valueAsString)
    );

    /* subscriber 2 */
    const phoneNo = new cdk.CfnParameter(this, "phoneNoParam", {type: 'String'}) // taking Input
    snsTopic.addSubscription(
      new snsSubscriptions.SmsSubscription(phoneNo.valueAsString)
    );

    const role = new iam.Role(this, "lambdaRole", {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["SNS:Publish", "logs:*", "ses:SendEmail"],
      resources: ['*']
    });
    role.addToPolicy(policy);

    const snsLambda = new lambda.Function(this, "snsLambda", {
      code: lambda.Code.fromAsset('functions'),
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'snsHandler.handler',
      environment: {
        SNS_TOPIC_ARN: snsTopic.topicArn,
        PHONE_NUMBER: phoneNo.valueAsString,
        OUR_REGION:this.region,
        OWNER_EMAIL: email.valueAsString
      },
      role: role
    })

    events.EventBus.grantAllPutEvents(httpDs);

    const dynamoLambdaFn = new lambda.Function(this, "dynamoLambda", {
      code: lambda.Code.fromAsset('functions'),
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'dynamo.handler'
    });

    const mutations = ["petForm"]

    mutations.forEach((mut) => {

      if(mut === 'petForm'){
        let details = `\\\"email\\\": \\\"$ctx.arguments.email\\\",\\\"phoneNo\\\": \\\"$ctx.arguments.phoneNo\\\",\\\"inputOne\\\": \\\"$ctx.arguments.inputOne\\\",\\\"inputTwo\\\": \\\"$ctx.arguments.inputTwo\\\"`

        const addPetResolver = httpDs.createResolver({
          typeName: "Mutation",
          fieldName: "petForm",
          requestMappingTemplate: appsync.MappingTemplate.fromString(requestTemplate(details, mut)),
          responseMappingTemplate: appsync.MappingTemplate.fromString(responseTemplate()),
        });

      }

    });

    const dynamodbTable = new dynamodb.Table(this, 'RestaurantAppTable', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: 'addPetTheory',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    dynamodbTable.grantFullAccess(dynamoLambdaFn);
    dynamoLambdaFn.addEnvironment('PET_EVENTS', dynamodbTable.tableName);

    //////////////// Creating Steps of StepFunctions //////////////////////////

    /* Step 1 */
    const firstStep = new stepFunctionsTasks.LambdaInvoke(this, "Dynamo_Handler_Lambda", {
      lambdaFunction: dynamoLambdaFn
    });

    /* Step 2 */
    const secondStep = new stepFunctionsTasks.LambdaInvoke(this, "SNS_Handler_Lambda", {
      lambdaFunction: snsLambda,
      inputPath: "$.Payload"
    });

    // creating chain to define the sequence of execution
    const stf_chain = stepFunctions.Chain.start(firstStep).next(secondStep);

    // create a state machine
    const stateMachine = new stepFunctions.StateMachine(this, "stateMachine", {
      definition: stf_chain
    });

    ////////// Creating rule to invoke step function on event ///////////////////////
    new events.Rule(this, "eventConsumerRule", {
      eventPattern: {
        source: ["eru-pet-events"],
        detailType: [...mutations]
      },
      targets: [new eventsTargets.SfnStateMachine(stateMachine)]
    });


  }
}
