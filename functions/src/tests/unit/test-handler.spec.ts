import { expect } from 'chai';
import { APIGatewayEvent, Context } from 'aws-lambda';
import * as app from '../../handlers/convert-number-handler';

/*

describe('Tests index', function () {
    it('verifies successful response', async () => {
        const event: APIGatewayEvent = {
            httpMethod: 'GET',
        } as APIGatewayEvent;
        const context: Context = {} as Context;
        const result = await app.handler(event, context);

        expect(result).to.be.an('object');
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.be.an('string');

        const response = JSON.parse(result.body);

        expect(response).to.be.an('object');
        expect(response.message).to.be.equal('hello world');
        // expect(response.location).to.be.an("string");
    });
});

*/