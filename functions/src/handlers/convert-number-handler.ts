import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Phone } from '../models'

export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
    try {
        const phone = JSON.parse(event.body) as Phone;

        validatePhone(phone);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: phone.number,
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

const validatePhone = (phone : Phone): void => {
    // This expression matches valid, ten digit US phone numbers
    const validPhoneNumber: RegExp = /^\+?1?\d{10}$/

    if (phone.number == null) {
        throw Error("Phone number was null or undefined.")
    }

    if (!phone.number.match(validPhoneNumber)) {
        throw Error("Invalid phone number.")
    }
}
