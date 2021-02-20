import { ConnectContactFlowEvent, ConnectContactFlowCallback, Context, ConnectContactFlowResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

var words = require('an-array-of-english-words'); // this library requires javascript-style import

export const handler = async (event: ConnectContactFlowEvent, context: Context, callback: ConnectContactFlowCallback ) => {

    AWS.config.update({region: "us-east-1"});

    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    try {
        const number = event['Details']['ContactData']['CustomerEndpoint']['Address'];

        const processedNumber = validateNumber(number);

        let vanityList = generateVanityNumbers(processedNumber);

        const params: any = {
            TableName: "VANITY_NUMBERS",
            Item: {
                phone_number: processedNumber, // modify with each invoke so the id does not repeat
                vanity_numbers: vanityList // modify content here
            },
            ConditionExpression: 'attribute_not_exists(phone_number)', // do not overwrite existing entries
            ReturnConsumedCapacity: 'TOTAL'
        };
        
        await dynamoClient.put(params).promise();

        let result: ConnectContactFlowResult = {};

        let finalVanityList = vanityList.slice(-3); // taking the last three (or fewer) elements of the array

        for (let i = 0; i < finalVanityList.length; i++) {
            result["number" + i] = finalVanityList[i].replace(/(.)/g, "$&, ");
        }

        callback(null, result);
    } catch (err) {
        console.log(err);
        callback(err);
    }
}


/**
 * validates phone number
 * @param phone 
 */
const validateNumber = (number : string): string => {
    // This expression matches valid, ten digit US phone numbers
    const validPhoneNumber: RegExp = /^(\+1|1)?\d{10}$/;

    if (!number) {
        throw Error("Phone number was null or undefined.");
    }

    if (!number.match(validPhoneNumber)) {
        throw Error("Invalid phone number.");
    }

    return processNumber(number);
}

const processNumber = (number: string): string => {
    const validPhoneNumber: RegExp = /^(\+1|1)?(\d{10})$/;
    
    // Strips country code if applicable
    return number.replace(validPhoneNumber, '$2')
}

const generateVanityNumbers = (number: string): string[] => {
    let firstSix = number.slice(0,6);
    let lastFour = number.slice(6).split('');

    let vanityList: string[] = [];
    
    const dialPadMap = new Map([
        ["0","0"],
        ["1", "1"],
        ["2", "ABC"],
        ["3", "DEF"],
        ["4", "GHI"],
        ["5", "JKL"],
        ["6", "MNO"],
        ["7", "PQRS"],
        ["8", "TUV"],
        ["9", "WXYZ"]
    ])

    let spotOneStr = dialPadMap.get(lastFour[0]).split("");
    let spotTwoStr = dialPadMap.get(lastFour[1]).split("");
    let spotThreeStr = dialPadMap.get(lastFour[2]).split("");
    let spotFourStr = dialPadMap.get(lastFour[3]).split(""); 

    /*
        Please let the record show that I am not very happy about the nesting on these for loops. 
        There is probably a more elegant solution with recursion.
    */
    for (let i = 0; i < spotOneStr.length; i++) {
        
        if (vanityList.length >= 10) { // list already contains 5 words
            break;
        }

        for (let j = 0; j < spotTwoStr.length; j++) {
            
            if (vanityList.length >= 10) { // list already contains 5 words
                break;
            }

            for (let k = 0; k < spotThreeStr.length; k++) {
                
                if (vanityList.length >= 10) { // list already contains 5 words
                    break;
                }

                for (let m = 0; m < spotFourStr.length; m++) {
                    if (vanityList.length >= 10) { // list already contains 5 words
                        break;
                    }
                    
                    let phoneWord = spotOneStr[i] + spotTwoStr[j] + spotThreeStr[k] + spotFourStr[m];
                    let vanityNumber = firstSix + phoneWord;
                    if(vanityList.length < 5 ) { // take the first 5 permutations (or fewer if lastFour is e.g. 1111)
                        vanityList.push(vanityNumber);
                    }

                    else if(words.includes(phoneWord.toLowerCase())) { // will add up to the first five matches in the dictionary
                        vanityList.push(vanityNumber);
                    }
                }
            }

        }
    }

    if (vanityList.length <= 5) {
        return vanityList;
    }
    
    return vanityList.slice(vanityList.length - 5); // return the most elements matching from the dictionary

}