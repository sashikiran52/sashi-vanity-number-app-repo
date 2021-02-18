import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Phone } from '../models';
import * as words from 'an-array-of-english-words';

export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
    try {
        const phone = JSON.parse(event.body) as Phone;

        validateNumber(phone);

        const processedNumber = processNumber(phone);

        let vanityList = generateVanityNumbers(processedNumber);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: processedNumber,
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Bad Request",
            }),
        };
    }
}


/**
 * validates phone number
 * @param phone 
 */
const validateNumber = (phone : Phone): void => {
    // This expression matches valid, ten digit US phone numbers
    const validPhoneNumber: RegExp = /^(\+1|1)?\d{10}$/;

    if (phone.number == null) {
        throw Error("Phone number was null or undefined.");
    }

    if (!phone.number.match(validPhoneNumber)) {
        throw Error("Invalid phone number.");
    }
}

const processNumber = (phone: Phone): string => {
    const validPhoneNumber: RegExp = /^(\+1|1)?(\d{10})$/;
    
    // Strips country code if applicable
    return phone.number.replace(validPhoneNumber, '$2')
}

const generateVanityNumbers = (number: string): string[] => {
    let firstSix = number.slice(0,6);
    let lastFour = number.slice(6).split('');

    let vanityList: string[];
    
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
        
        if (vanityList.length > 10) { // list already contains 5 words
            break;
        }

        for (let j = 0; j < spotTwoStr.length; j++) {
            
            if (vanityList.length > 10) { // list already contains 5 words
                break;
            }

            for (let k = 0; k < spotThreeStr.length; k++) {
                
                if (vanityList.length > 10) { // list already contains 5 words
                    break;
                }

                for (let m = 0; m < spotFourStr.length; m++) {
                    if (vanityList.length > 10) { // list already contains 5 words
                        break;
                    }
                    
                    let phoneWord = spotOneStr[i] + spotTwoStr[j] + spotThreeStr[k] + spotFourStr[m];
                    let vanityNumber = firstSix + phoneWord;
                    if(vanityList.length < 5 ) { // take the first 5 permutations (or fewer if lastFour is e.g. 1111)
                        vanityList.push(vanityNumber);
                    }

                    else if(words.includes(phoneWord)) { // will add up to the first five matches in the dictionary
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