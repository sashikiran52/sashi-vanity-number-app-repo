import { ConnectContactFlowEvent, ConnectContactFlowCallback, Context, ConnectContactFlowResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

const words = require('an-array-of-english-words'); // this library requires javascript-style import

export const handler = async (
    event: ConnectContactFlowEvent,
    context: Context,
    callback: ConnectContactFlowCallback,
) => {
    AWS.config.update({ region: process.env.AWS_REGION });

    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    try {
        const number = event['Details']['ContactData']['CustomerEndpoint']['Address']; // getting phone number passed by Connect

        const processedNumber = validateNumber(number, dynamoClient);

        const vanityList = await generateVanityNumbers(processedNumber, dynamoClient);

        const result: ConnectContactFlowResult = {};

        const finalVanityList = vanityList.slice(-3); // taking the last three (or fewer) elements of the array to return to Connect

        for (let i = 0; i < finalVanityList.length; i++) {
            result['number' + i] = finalVanityList[i].replace(/(.)/g, '$&, ');
        }

        callback(null, result);
        let status = 'Success!';
        console.log(status);
        return status;
    } catch (err) {
        let status = 'Failure!';
        console.log(status);
        console.log(err);
        callback(err);
        return status;
    }
};

/**
 * validates phone number
 * @param phone
 */
const validateNumber = (number: string, dynamoClient: DynamoDB.DocumentClient): string => {
    // This expression matches valid, ten digit US phone numbers
    const validPhoneNumber = /^(\+1|1)?\d{10}$/;

    if (!number) {
        throw Error('Phone number was null or undefined.');
    }

    if (!number.match(validPhoneNumber)) {
        throw Error('Invalid phone number.');
    }

    return processNumber(number);
};

/**
 * Strips country code if applicable
 * @param number
 */
const processNumber = (number: string): string => {
    const validPhoneNumber = /^(\+1|1)?(\d{10})$/;

    // Strips country code if applicable
    return number.replace(validPhoneNumber, '$2');
};

/**
 * Checks if vanity list already exists. If so, returns it. If not, generates a vanity list.
 * @param number
 * @param dynamoClient
 */
const generateVanityNumbers = async (number: string, dynamoClient: DynamoDB.DocumentClient): Promise<string[]> => {
    let vanityList: string[] = await checkNumber(number, dynamoClient);

    if (vanityList) {
        //if the vanityList is already in the database, return it
        return vanityList;
    }

    vanityList = [];

    const firstSix = number.slice(0, 6);
    const lastFour = number.slice(6).split('');

    const dialPadMap = new Map([
        ['0', '0'],
        ['1', '1'],
        ['2', 'ABC'],
        ['3', 'DEF'],
        ['4', 'GHI'],
        ['5', 'JKL'],
        ['6', 'MNO'],
        ['7', 'PQRS'],
        ['8', 'TUV'],
        ['9', 'WXYZ'],
    ]);

    const spotOneStr = dialPadMap.get(lastFour[0]).split('');
    const spotTwoStr = dialPadMap.get(lastFour[1]).split('');
    const spotThreeStr = dialPadMap.get(lastFour[2]).split('');
    const spotFourStr = dialPadMap.get(lastFour[3]).split('');

    /*
        Please let the record show that I am not very happy about the nesting on these for loops. 
        There is probably a more elegant solution with recursion.
    */
    for (let i = 0; i < spotOneStr.length; i++) {
        if (vanityList.length >= 10) {
            // list already contains 5 words
            break;
        }

        for (let j = 0; j < spotTwoStr.length; j++) {
            if (vanityList.length >= 10) {
                // list already contains 5 words
                break;
            }

            for (let k = 0; k < spotThreeStr.length; k++) {
                if (vanityList.length >= 10) {
                    // list already contains 5 words
                    break;
                }

                for (let m = 0; m < spotFourStr.length; m++) {
                    if (vanityList.length >= 10) {
                        // list already contains 5 words
                        break;
                    }

                    const phoneWord = spotOneStr[i] + spotTwoStr[j] + spotThreeStr[k] + spotFourStr[m];
                    const vanityNumber = firstSix + phoneWord;
                    if (vanityList.length < 5) {
                        // take the first 5 permutations (or fewer if lastFour is e.g. 1111)
                        vanityList.push(vanityNumber);
                    } else if (words.includes(phoneWord.toLowerCase())) {
                        // will add up to the first five matches in the dictionary
                        vanityList.push(vanityNumber);
                    }
                }
            }
        }
    }

    vanityList = vanityList.slice(-5); //only consider the last 5 (or fewer) elements added

    console.log('Generated vanity numbers! Saving to db: ' + vanityList);
    await save(number, vanityList, dynamoClient);

    return vanityList;
};

/**
 * Checks if the number already exists in the Dynamo
 * @param number
 * @param dynamoClient
 */
const checkNumber = async (number: string, dynamoClient: DynamoDB.DocumentClient): Promise<string[]> => {
    const params = {
        TableName: 'VANITY_NUMBERS',
        Key: {
            phone_number: number,
        },
    };

    const result = await dynamoClient.get(params).promise();

    try {
        console.log('Found vanity numbers in db: ' + result.Item['vanity_numbers']);
        return result.Item['vanity_numbers'];
    } catch (err) {
        return null; //returns null if no vanity_numbers attribute exists
    }
};

/**
 * Saves an item to the Dynamo table
 *
 * @param number
 * @param vanityList generated vanity list
 * @param dynamoClient client to save items to Dynamo table
 */
const save = async (number: string, vanityList: string[], dynamoClient: DynamoDB.DocumentClient) => {
    const params: any = {
        TableName: 'VANITY_NUMBERS',
        Item: {
            phone_number: number,
            vanity_numbers: vanityList,
        },
        ConditionExpression: 'attribute_not_exists(phone_number)', // do not overwrite existing entries, but shouldn't trigger since checkNumber() handles this
        ReturnConsumedCapacity: 'TOTAL',
    };

    await dynamoClient.put(params).promise();
};
