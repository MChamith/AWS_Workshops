import {
  APIGatewayProxyResult,
  APIGatewayEvent
} from 'aws-lambda';

import {
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';

import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

const ORDERS_TABLE = process.env.ORDERS_TABLE || '';
const dynamoDb = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(dynamoDb);

interface OrderDetail {
  resturantId: string;
  totalAmount: number;
  orderItems: Record<string, unknown>[];
  userId: string;
  orderId: string;
}

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler = (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  return addOrder(event)
    .catch(error => {
      console.log(error);
      return {
        statusCode: 400,
        headers: { ...defaultHeaders },
        body: JSON.stringify({ Error: error }),
      };
    });
};

const addOrder = (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const detail = JSON.parse(event.body || '{}') as OrderDetail;

  const restaurantId = detail.resturantId;
  const totalAmount = detail.totalAmount;
  const orderItems = detail.orderItems;
  const userId = event.requestContext?.authorizer?.claims?.sub as string;
  const orderTime = new Date().toISOString();
  const orderId = detail.orderId;

  const ddbItem = {
    orderId,
    userId,
    data: {
      orderId,
      userId,
      restaurantId,
      totalAmount,
      orderItems,
      status: 'PLACED',
      orderTime,
    }
  };

  return documentClient.send(new PutCommand({
    TableName: ORDERS_TABLE,
    Item: ddbItem,
  })).then(() => ({
    statusCode: 200,
    headers: { ...defaultHeaders },
    body: JSON.stringify(ddbItem),
  }));
};

