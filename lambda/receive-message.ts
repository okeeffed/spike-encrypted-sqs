import { SQS, KMS } from "aws-sdk";
import * as crypto from "crypto";

const sqs = new SQS();
const kms = new KMS();

const queueUrl = process.env.QUEUE_URL!;

exports.handler = async (_event: any) => {
  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1,
    MessageAttributeNames: ["All"],
    WaitTimeSeconds: 10,
  };

  try {
    const result = await sqs.receiveMessage(params).promise();
    if (result.Messages && result.Messages.length > 0) {
      const message = result.Messages[0];
      const encryptedMessage = message.Body;
      const encryptedKey =
        message.MessageAttributes?.EncryptedDataKey.StringValue;
      const ivBase64 = message.MessageAttributes?.IV.StringValue;
      const authTagBase64 = message.MessageAttributes?.AuthTag.StringValue;

      console.log("Encrypted message received:", encryptedMessage);
      console.log("Encrypted data key:", encryptedKey);
      console.log("IV:", ivBase64);
      console.log("Auth tag:", authTagBase64);

      if (encryptedKey && ivBase64 && authTagBase64 && encryptedMessage) {
        const dataKey = await kms
          .decrypt({
            CiphertextBlob: Buffer.from(encryptedKey, "base64"),
          })
          .promise();

        const key = dataKey.Plaintext!;
        const iv = Buffer.from(ivBase64, "base64");
        const authTag = Buffer.from(authTagBase64, "base64");

        // @ts-expect-error: type has cross-over so I'm hacking this in to ignore
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedMessage, "base64", "utf8");
        decrypted += decipher.final("utf8");

        console.log("Decrypted message:", decrypted);

        await sqs
          .deleteMessage({
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle!,
          })
          .promise();

        return decrypted;
      } else {
        console.error(
          "Missing EncryptedDataKey, IV, or AuthTag in message attributes"
        );
      }
    } else {
      console.log("No messages received");
    }
  } catch (error) {
    console.error("Error receiving or decrypting message", error);
  }
};
