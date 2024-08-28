import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cr from "aws-cdk-lib/custom-resources";
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
    // カスタムリソースを使用して環境変数を設定
    new cr.AwsCustomResource(this, "SetEnvVars", {
      onUpdate: {
        service: "Lambda",
        action: "updateFunctionConfiguration",
        parameters: {
          FunctionName: fn.functionName,
          Environment: {
            Variables: {
              BUCKET_NAME: bucket.bucketName,
              UPLOAD_URL: fnUrl.url,
            },
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of("EnvVarSetter"),
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ["lambda:UpdateFunctionConfiguration"],
          resources: [fn.functionArn],
        }),
      ]),
    });

    new cdk.CfnOutput(this, "HonoFileUploadHandlerUrl", {
      value: fnUrl.url,
    });
  }
}
