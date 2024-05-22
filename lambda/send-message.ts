import { SQS, KMS } from "aws-sdk";
import * as crypto from "crypto";

const sqs = new SQS();
const kms = new KMS();

const queueUrl = process.env.QUEUE_URL!;
const kmsKeyId = process.env.KMS_KEY_ID!;

exports.handler = async (_event: any) => {
  const messageBody = "This is a sensitive message";

  console.log("Original message:", messageBody);

  const dataKey = await kms
    .generateDataKey({
      KeyId: kmsKeyId,
      KeySpec: "AES_256",
    })
    .promise();

  // Ensure the key is used as a Buffer
  const key = dataKey.Plaintext!;
  const encryptedKey = dataKey.CiphertextBlob!.toString("base64");
  const iv = crypto.randomBytes(12);

  // @ts-expect-error: type has cross-over so I'm hacking this in to ignore
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(messageBody, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  const ivBase64 = iv.toString("base64");

  console.log("Encrypted message:", encrypted);
  console.log("Encrypted data key:", encryptedKey);
  console.log("IV:", ivBase64);
  console.log("Auth tag:", authTag);

  const params = {
    QueueUrl: queueUrl,
    MessageBody: encrypted,
    MessageAttributes: {
      EncryptedDataKey: {
        DataType: "String",
        StringValue: encryptedKey,
      },
      IV: {
        DataType: "String",
        StringValue: ivBase64,
      },
      AuthTag: {
        DataType: "String",
        StringValue: authTag,
      },
    },
  };

  try {
    const result = await sqs.sendMessage(params).promise();
    console.log("Message sent successfully", result.MessageId);
  } catch (error) {
    console.error("Error sending message", error);
  }
};
