import {
  APIGatewayProxyResult,
  APIGatewayEvent
} from 'aws-lambda';

import {
  getOrder
} from 'order-utils';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const orderId = event.pathParameters?.orderId;
  const userId = event.requestContext?.authorizer?.claims?.sub as string | undefined;

  if (!orderId) {
    return {
      statusCode: 400,
      headers: { ...defaultHeaders },
      body: JSON.stringify({ message: 'Path parameter orderId is required' }),
    };
  }

  if (!userId) {
    return {
      statusCode: 401,
      headers: { ...defaultHeaders },
      body: JSON.stringify({ message: 'Unauthorized: missing user information' }),
    };
  }

  try {
    const orderData = await getOrder(userId, orderId);
    // Return the same structure as create_order: {orderId, userId, data: {...}}
    const response = {
      orderId,
      userId,
      data: orderData,
    };
    return {
      statusCode: 200,
      headers: { ...defaultHeaders },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Failed to fetch order', { orderId, userId, error });

    const notFound = error instanceof Error && /not found/i.test(error.message);
    return {
      statusCode: notFound ? 404 : 500,
      headers: { ...defaultHeaders },
      body: JSON.stringify({
        message: notFound ? 'Order not found' : 'Failed to fetch order',
        orderId,
      }),
    };
  }
};
