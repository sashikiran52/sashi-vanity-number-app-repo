# vanity-number-app

This project is a Node.js/Typescript Lambda Function that integrates with Amazon Connect to convert a caller's U.S. phone number into vanity number possibilities. It considers the last four digits of the phone number that is passed by Connect as a ConnectCallFlowEvent and converts them to letters based on dial pad options. Each option is checked against a word library of 100,000 common English words. Up to five matches will be returned. If there are fewer than five matches, the function will pad the choices with the first several options it considered. The five matches are stored in a DynamoDB table, and then three of those are returned to the Amazon call flow to be read back to the user.

## Install dependencies

Change directories to `./functions` and run

```bash
vanity-number-app/functions$ npm i
```

## Build
To build this application, run

```bash
vanity-number-app/functions$ npm run build
```
The application is cleaned with rimraf (to support Windows users) and then is built with webpack. Minified, production-ready js files are built to `dist/`.

## Deploy
You must build before deploying. To deploy the application, ensure your AWS CLI is configured to the AWS account you are trying to deploy to. Run:

```bash
vanity-number-app/functions$ npm run deploy
```
SAM (Serverless Application Model) will do a guided deployment, asking for input on several items. After the first time it runs, the options you selected will be default and saved in your `samconfig.toml` file. SAM creates a CloudFormation stack and deploys the application to your account. Outputs include the ARNs for the Lambda Function as well as the generated implicit IAM Role.

After deployment, to add the call flow to your Connect instance, navigate to the Amazon Connect console, click on your instance alias, click "Contact flows", navigate down to AWS Lambda, select the Lamba Function deployed by this application, and add it. Then, change the `value` key on line 91 of the `VanityNumberFlow.json` in `./functions/src/flows` to be the Convert Number Function ARN outputted by the CloudFormation stack when you deployed with SAM (e.g. `arn:aws:lambda:us-east-1:XXXXXXXXXXXX:function:vanity-number-app-ConvertNumberFunction-XXXXXXXXXXXX`). Login to your Amazon Connect instance, and under routing, go to "Contact Flows". Select "Create New Flow" and on the drop down menu next to save, select "Import flow". Save and publish the flow, then add it to one of your phone numbers from the "Phone numbers" menu under routing.

## Unit tests

Tests are defined in the `functions/src/tests` folder in this project. Run:

```bash
vanity-number-app/functions$ npm run test
```
to run tests.

## Cleanup

To delete the application, use the AWS CLI. Assuming you used the project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name vanity-number-app
```
You can also delete the imported contact flow from the Contact Flows menu in your Connect instance.

## Architecture diagram

See the [Architecture Diagram](https://app.cloudcraft.co/view/537f7161-3d79-4d1c-b946-d2b84a539512?key=NZLmW7XOmgNYy8ackmdscA) for this application.

## About the development

Before having done this project, the bulk of my experience with Lambda Function deployments was using [serverless](https://www.serverless.com), which natively deploys Typescript. In contrast, SAM requires a JS file, so I needed to use webpack to compile the Typescript code back to JavaScript before deployment.

In a production environment, a stricter security policy should be used on the Lambda Function so it can only access the Dynamo tables it needs (instead of all of them).

I would have preferred to write that function with recursion rather than nested for-loops. I don't think the recursion would have improved time complexity since each letter combination needs to be checked for word matches, but it may have looked prettier.

The code could be modified to allow matching of the last seven or even all ten digits of the phone number. I only considered the last 4 digits of the phone number for the sake of simplicity. Another improvement that could be made is to use RegEx to use close matches of words or strings that contain other words. Solving this way could get very intricate.

I had a hard time trying to get the Amazon Connect text-to-speech module to correctly say the vanity number. I solved this by adding a comma and space in between every character in each vanity number returned to the Connect contact flow.

For my unit tests, I used a package that helped me mock the Dynamo document client get and put. This allowed me to unit test the function even though it had integrations with Dynamo. I also mocked the ConnectContactFlowEvent to pass the phone number in during my tests.
