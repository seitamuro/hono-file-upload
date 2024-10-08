import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class HonoFileUploadStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "Bucket", {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: "hono-file-upload-bucket-seimiura",
    });

    const fn = new NodejsFunction(this, "HonoFileUploadHandler", {
      entry: "lambda/index.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });
    bucket.grantPut(fn);
    const fnUrl = fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new cdk.CfnOutput(this, "HonoFileUploadHandlerUrl", {
      value: fnUrl.url,
    });
  }
}
