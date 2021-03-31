import * as cdk from '@aws-cdk/core';
import * as S3 from "@aws-cdk/aws-s3";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';

export class PetEventDeploymentStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

     // The code that defines your stack goes here

     const websiteBucket = new S3.Bucket(this , "EventPetBucket" , {
      versioned : true,
      websiteIndexDocument : "index.html",
      publicReadAccess : true
    });

    // distribution
    const dist = new cloudfront.Distribution(this , "myPet_Distribution" , {
      defaultBehavior : {
        origin : new origins.S3Origin(websiteBucket)
      }
    });

    // content which will be in the s3 bucket
    new s3Deployment.BucketDeployment(this , "DeployEventPet-App" , {
      sources  : [s3Deployment.Source.asset("../Pet-Event-Frontend/public")],
      destinationBucket: websiteBucket,
      distribution : dist
    });

    new cdk.CfnOutput(this , "CloudFrontURL" , {
      value : dist.domainName
    });


  }
}
