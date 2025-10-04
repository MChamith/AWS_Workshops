import json
import os
import boto3
from datetime import datetime
import uuid
# import requests

#Prepare dynanamodb clients

USERS_TABLE = os.getenv('USERS_TABLE', None)
dynamodb = boto3.resource('dynamodb')
ddbTable = dynamodb.Table(USERS_TABLE)

def lambda_handler(event, context):

    route_key = f"{event['httpMethod']} {event['resource']}"

    response_body = {'Message': 'Unknown route'}
    status_code = 400

    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    try:
        if route_key == 'GET /users':
            response_body = ddbTable.scan(Select='ALL_ATTRIBUTES')['Items']
            status_code = 200

        if route_key == 'GET /users/{userid}':
            ddb_response = ddbTable.get_item(Key={'userid': event['pathParameters']['userid']})

            if 'Item' in ddb_response:
                response_body = ddb_response['Item']
            else:
                response_body = {}
            status_code = 200

        if route_key == 'DELETE /users/{userid}':
            ddbTable.delete_item(Key={'userid': event['pathParameters']['userid']})
            response_body = {}
            status_code = 200 

        # Create a new user 
        if route_key == 'POST /users':
            request_json = json.loads(event['body'])
            request_json['timestamp'] = datetime.now().isoformat()
            # generate unique id if it isn't present in the request
            if 'userid' not in request_json:
                request_json['userid'] = str(uuid.uuid1())
            # update the database
            ddbTable.put_item(
                Item=request_json
            )
            response_body = request_json
            status_code = 200

        # Update a specific user by ID
        if route_key == 'PUT /users/{userid}':
            # update item in the database
            request_json = json.loads(event['body'])
            request_json['timestamp'] = datetime.now().isoformat()
            request_json['userid'] = event['pathParameters']['userid']
            # update the database
            ddbTable.put_item(
                Item=request_json
            )
            response_body = request_json
            status_code = 200
    except Exception as err:
        status_code = 400
        response_body = {'Error:': str(err)}
        print(str(err))
    return {
        'statusCode': status_code,
        'body': json.dumps(response_body),
        'headers': headers
    } 
 