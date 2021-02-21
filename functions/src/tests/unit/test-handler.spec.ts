import { expect } from 'chai';
import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import { ConnectContactFlowEvent, Context } from 'aws-lambda';
import * as app from '../../handlers/convert-number-handler';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

describe('Tests handler', function () {
    beforeEach(async () => {
        process.env.AWS_REGION = 'test';
    });

    it('executes successfully if item already exists in database', async () => {
        AWSMock.setSDKInstance(AWS);
        AWSMock.mock('DynamoDB.DocumentClient', 'get', async (params: DocumentClient.GetItemInput) => {
            console.log('DynamoDB.DocumentClient', 'get', 'Mock called.');
            return {
                Item: {
                    phone_number: params.Key.phone_number,
                    vanity_numbers: ['800FLOWERS', '800FLOWERS', '800FLOWERS', '800FLOWERS', '800FLOWERS'],
                },
            };
        });

        const event: ConnectContactFlowEvent = {
            Name: 'ContactFlowEvent',
            Details: {
                ContactData: {
                    Attributes: {},
                    Channel: 'VOICE',
                    ContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    CustomerEndpoint: {
                        Address: '+11234567890',
                        Type: 'TELEPHONE_NUMBER',
                    },
                    InitialContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    InitiationMethod: 'API',
                    InstanceARN: 'arn:aws:connect:us-east-1:123456789012:instance/9308c2a1-9bc6-4cea-8290-6c0b4a6d38fa',
                    MediaStreams: {
                        Customer: {
                            Audio: {
                                StartFragmentNumber: '91343852333181432392682062622220590765191907586',
                                StartTimestamp: '1565781909613',
                                StreamARN:
                                    'arn:aws:kinesisvideo:us-east-1:123456789012:stream/connect-contact-a3d73b84-ce0e-479a-a9dc-5637c9d30ac9/1565272947806',
                            },
                        },
                    },
                    PreviousContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    Queue: null,
                    SystemEndpoint: {
                        Address: '+11234567890',
                        Type: 'TELEPHONE_NUMBER',
                    },
                },
                Parameters: {},
            },
        } as ConnectContactFlowEvent;
        const context: Context = {} as Context;
        const result = await app.handler(event, context, () => {});

        expect(result).to.be.an('string');
        expect(result).to.be.equal('Success!');

        AWSMock.restore('DynamoDB.DocumentClient');
    });

    it('executes successfully if item does not exist in database', async () => {
        AWSMock.setSDKInstance(AWS);
        AWSMock.mock(
            'DynamoDB.DocumentClient',
            'get',
            async (params: DocumentClient.GetItemInput): Promise<undefined> => {
                console.log('DynamoDB.DocumentClient', 'get', 'Mock called.');
                return undefined;
            },
        );

        AWSMock.mock('DynamoDB.DocumentClient', 'put', async (params: DocumentClient.PutItemInput) => {
            console.log('DynamoDB.DocumentClient', 'put', 'Mock called.');
        });

        const event: ConnectContactFlowEvent = {
            Name: 'ContactFlowEvent',
            Details: {
                ContactData: {
                    Attributes: {},
                    Channel: 'VOICE',
                    ContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    CustomerEndpoint: {
                        Address: '+11234567890',
                        Type: 'TELEPHONE_NUMBER',
                    },
                    InitialContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    InitiationMethod: 'API',
                    InstanceARN: 'arn:aws:connect:us-east-1:123456789012:instance/9308c2a1-9bc6-4cea-8290-6c0b4a6d38fa',
                    MediaStreams: {
                        Customer: {
                            Audio: {
                                StartFragmentNumber: '91343852333181432392682062622220590765191907586',
                                StartTimestamp: '1565781909613',
                                StreamARN:
                                    'arn:aws:kinesisvideo:us-east-1:123456789012:stream/connect-contact-a3d73b84-ce0e-479a-a9dc-5637c9d30ac9/1565272947806',
                            },
                        },
                    },
                    PreviousContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    Queue: null,
                    SystemEndpoint: {
                        Address: '+11234567890',
                        Type: 'TELEPHONE_NUMBER',
                    },
                },
                Parameters: {},
            },
        } as ConnectContactFlowEvent;
        const context: Context = {} as Context;
        const result = await app.handler(event, context, () => {});

        expect(result).to.be.an('string');
        expect(result).to.be.equal('Success!');

        AWSMock.restore('DynamoDB.DocumentClient');
    });

    it('fails if a null number is passed', async () => {
        AWSMock.setSDKInstance(AWS);

        const event: ConnectContactFlowEvent = {
            Name: 'ContactFlowEvent',
            Details: {
                ContactData: {
                    Attributes: {},
                    Channel: 'VOICE',
                    ContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    CustomerEndpoint: {
                        Address: null,
                        Type: 'TELEPHONE_NUMBER',
                    },
                    InitialContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    InitiationMethod: 'API',
                    InstanceARN: 'arn:aws:connect:us-east-1:123456789012:instance/9308c2a1-9bc6-4cea-8290-6c0b4a6d38fa',
                    MediaStreams: {
                        Customer: {
                            Audio: {
                                StartFragmentNumber: '91343852333181432392682062622220590765191907586',
                                StartTimestamp: '1565781909613',
                                StreamARN:
                                    'arn:aws:kinesisvideo:us-east-1:123456789012:stream/connect-contact-a3d73b84-ce0e-479a-a9dc-5637c9d30ac9/1565272947806',
                            },
                        },
                    },
                    PreviousContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    Queue: null,
                    SystemEndpoint: {
                        Address: null,
                        Type: 'TELEPHONE_NUMBER',
                    },
                },
                Parameters: {},
            },
        } as ConnectContactFlowEvent;
        const context: Context = {} as Context;
        const result = await app.handler(event, context, () => {});

        expect(result).to.be.an('string');
        expect(result).to.be.equal('Failure!');
    });

    it('fails if a foreign number is calling', async () => {
        AWSMock.setSDKInstance(AWS);

        const event: ConnectContactFlowEvent = {
            Name: 'ContactFlowEvent',
            Details: {
                ContactData: {
                    Attributes: {},
                    Channel: 'VOICE',
                    ContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    CustomerEndpoint: {
                        Address: '+490302270',
                        Type: 'TELEPHONE_NUMBER',
                    },
                    InitialContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    InitiationMethod: 'API',
                    InstanceARN: 'arn:aws:connect:us-east-1:123456789012:instance/9308c2a1-9bc6-4cea-8290-6c0b4a6d38fa',
                    MediaStreams: {
                        Customer: {
                            Audio: {
                                StartFragmentNumber: '91343852333181432392682062622220590765191907586',
                                StartTimestamp: '1565781909613',
                                StreamARN:
                                    'arn:aws:kinesisvideo:us-east-1:123456789012:stream/connect-contact-a3d73b84-ce0e-479a-a9dc-5637c9d30ac9/1565272947806',
                            },
                        },
                    },
                    PreviousContactId: '5ca32fbd-8f92-46af-92a5-6b0f970f0efe',
                    Queue: null,
                    SystemEndpoint: {
                        Address: '+490302270',
                        Type: 'TELEPHONE_NUMBER',
                    },
                },
                Parameters: {},
            },
        } as ConnectContactFlowEvent;
        const context: Context = {} as Context;
        const result = await app.handler(event, context, () => {});

        expect(result).to.be.an('string');
        expect(result).to.be.equal('Failure!');
    });
});
