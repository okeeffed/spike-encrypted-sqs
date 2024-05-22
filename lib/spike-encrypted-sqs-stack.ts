import { Stack, StackProps } from "aws-cdk-lib";
import * as kms from "aws-cdk-lib/aws-kms";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";

export class SpikeEncryptedSqsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a KMS key for SQS encryption at rest
    const sqsKmsKey = new kms.Key(this, "SqsKmsKey", {
      enableKeyRotation: true,
      alias: "sqs-key-alias",
    });

    // Create a KMS key for payload encryption
    const payloadKmsKey = new kms.Key(this, "PayloadKmsKey", {
      enableKeyRotation: true,
      alias: "payload-key-alias",
    });

    // Create an SQS queue with KMS encryption using the first key
    const queue = new sqs.Queue(this, "MyQueue", {
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: sqsKmsKey,
    });

    // Lambda function to send encrypted messages
    const senderFunction = new lambdaNodejs.NodejsFunction(
      this,
      "SenderFunction",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        handler: "handler",
        entry: path.join(__dirname, "../lambda/send-message.ts"),
        environment: {
          QUEUE_URL: queue.queueUrl,
          KMS_KEY_ID: payloadKmsKey.keyId,
        },
      }
    );

    // Lambda function to receive and decrypt messages
    const receiverFunction = new lambdaNodejs.NodejsFunction(
      this,
      "ReceiverFunction",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        handler: "handler",
        entry: path.join(__dirname, "../lambda/receive-message.ts"),
        environment: {
          QUEUE_URL: queue.queueUrl,
        },
      }
    );

    // Grant permissions
    queue.grantSendMessages(senderFunction);
    queue.grantConsumeMessages(receiverFunction);
    payloadKmsKey.grantEncryptDecrypt(senderFunction);
    payloadKmsKey.grantDecrypt(receiverFunction);
  }
}
