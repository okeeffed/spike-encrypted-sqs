# SQS Encryption Spike

## Outcome

Use custom KMS encryption for both SQS and the payload.

## Recap

```sh
# Create a new TS CDK app within an empty directory
$ npx cdk init app --language typescript
$ npm i aws-sdk
```

Then I added in the stack at `lib/spike-encrypted-sqs-stack.ts` (just crammed everything into one file this time).

Finally, I added the code into `lambda/receive-message.ts` and `lambda/send-message.ts`

## Deploying

I used `aws-vault` to test. Ensure your creds are available.

Then you can run:

```sh
# All commands
$ npm run build
$ npm run cdk -- synth
$ npm run cdk -- deploy
```

## Testing

1. Log into AWS
2. Head to the `SenderFunction`
3. Run a test. If it succeeds, you can check the log output.
4. Head to the `RecieverFunction`
5. Run a test. If it succeeds, you can check the logs.

The logs for an example `SenderFunction` look like this:

```txt
START RequestId: af9f6238-2936-4672-a6cd-099a06eeafd0 Version: $LATEST
2024-05-22T05:40:53.309Z	af9f6238-2936-4672-a6cd-099a06eeafd0	INFO	Original message: This is a sensitive message
2024-05-22T05:40:53.954Z	af9f6238-2936-4672-a6cd-099a06eeafd0	INFO	Encrypted message: dP3+jR+L13/axYWFMNdg4/pWpn8JSQmSp0BW
2024-05-22T05:40:53.954Z	af9f6238-2936-4672-a6cd-099a06eeafd0	INFO	Encrypted data key: AQIDAHjyroPDM2WuUpluiCnH5s1dXd/twDOP5HC9GLbmHe60BQHzwEO+pF6X3IFyMaxYldDTAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMOBITRJGMCxwEHp1bAgEQgDswrw48/60dbJ20d6Vg9uoTN5RyVilDSM3NwX4vOGHIcZIYqgiGv+iq7+Y499+C6GfYnlTtt9L3q9S12A==
2024-05-22T05:40:53.954Z	af9f6238-2936-4672-a6cd-099a06eeafd0	INFO	IV: VQK0ekwlodbdUESd
2024-05-22T05:40:53.954Z	af9f6238-2936-4672-a6cd-099a06eeafd0	INFO	Auth tag: PQlTJNrYie3czTbIzhH8Tw==
2024-05-22T05:40:54.122Z	af9f6238-2936-4672-a6cd-099a06eeafd0	INFO	Message sent successfully c050cdb8-5c8e-4c88-929d-533cb4898458
END RequestId: af9f6238-2936-4672-a6cd-099a06eeafd0
REPORT RequestId: af9f6238-2936-4672-a6cd-099a06eeafd0	Duration: 826.95 ms	Billed Duration: 827 ms	Memory Size: 128 MB	Max Memory Used: 121 MB	Init Duration: 616.88 ms
```

This logs for an example `RecieverFunction` look like this:

```txt
START RequestId: b95a69ed-8271-493a-93b6-f868fd635533 Version: $LATEST
2024-05-22T05:42:51.274Z	b95a69ed-8271-493a-93b6-f868fd635533	INFO	Encrypted message received: dP3+jR+L13/axYWFMNdg4/pWpn8JSQmSp0BW
2024-05-22T05:42:51.274Z	b95a69ed-8271-493a-93b6-f868fd635533	INFO	Encrypted data key: AQIDAHjyroPDM2WuUpluiCnH5s1dXd/twDOP5HC9GLbmHe60BQHzwEO+pF6X3IFyMaxYldDTAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMOBITRJGMCxwEHp1bAgEQgDswrw48/60dbJ20d6Vg9uoTN5RyVilDSM3NwX4vOGHIcZIYqgiGv+iq7+Y499+C6GfYnlTtt9L3q9S12A==
2024-05-22T05:42:51.275Z	b95a69ed-8271-493a-93b6-f868fd635533	INFO	IV: VQK0ekwlodbdUESd
2024-05-22T05:42:51.275Z	b95a69ed-8271-493a-93b6-f868fd635533	INFO	Auth tag: PQlTJNrYie3czTbIzhH8Tw==
2024-05-22T05:42:51.433Z	b95a69ed-8271-493a-93b6-f868fd635533	INFO	Decrypted message: This is a sensitive message
END RequestId: b95a69ed-8271-493a-93b6-f868fd635533
REPORT RequestId: b95a69ed-8271-493a-93b6-f868fd635533	Duration: 854.81 ms	Billed Duration: 855 ms	Memory Size: 128 MB	Max Memory Used: 121 MB	Init Duration: 683.96 ms
```

## Teardown

Make sure the run `npm run cdk -- destroy` when you finished.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
