import {
    DynamoDBClient,
  } from '@aws-sdk/client-dynamodb';
  
  import {
    DynamoDBDocumentClient,
    GetCommand,
  } from '@aws-sdk/lib-dynamodb';


const dynamoDb = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(dynamoDb);
const ORDERS_TABLE = process.env.ORDERS_TABLE;

if (!ORDERS_TABLE) {
  throw new Error('ORDERS_TABLE environment variable must be defined');
}

interface Order {
  userId: string;
  orderId: string;
  restaurantId: string;
  totalAmount: number;
  orderItems: Record<string, unknown>[];
  status: string;
  orderTime: string;
}

export const getOrder = async (userId: string, orderId: string): Promise<Order> => {
  const command = new GetCommand({
    TableName: ORDERS_TABLE,
    Key: { userId, orderId },
  });
  try {
    const result = await documentClient.send(command);

    if (!result.Item) {
      throw new Error(`Order ${orderId} for user ${userId} not found`);
    }

    // Handle the nested data structure that's actually stored in DynamoDB
    const item = result.Item as { orderId: string; userId: string; data: Order };
    return item.data;
  } catch (error) {
    console.error('Failed to fetch order from DynamoDB', { userId, orderId, error });
    throw error;
  }
};
