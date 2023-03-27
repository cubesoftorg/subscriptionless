import {
  ConnectionInitMessage,
  SubscribeMessage,
  CompleteMessage,
  PingMessage,
  PongMessage,
} from 'graphql-ws';
import { APIGatewayEvent } from 'aws-lambda';
import { GraphQLSchema } from 'graphql';
import { ConnectionModel } from './model/connection';
import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoStore } from '@shiftcoders/dynamo-easy';

export type ServerArgs = {
  /** GraphQL schema containing subscriptions. */
  schema: GraphQLSchema;
  /** Constructor function for GraphQL context. */
  context?: ((arg: { connectionParams: any }) => object) | object;

  /** Options for server->client ping/pong (recommended). */
  ping?: {
    /** Rate at which pings are sent. */
    interval: number;
    /** Time for pong response before closing socket. */
    timeout: number;
    /** State machine resource for dispatching pings. */
    machineArn: string;
  };

  /** Override default table names. */
  tableNames?: Partial<TableNames>;
  /** Required DynamoDB instance. */
  dynamodb: DynamoDB;

  /** Called on incoming API Gateway `$connect` event. */
  onConnect?: (e: { event: APIGatewayEvent }) => MaybePromise<void>;
  /** Called on incoming API Gateway `$disconnect` event. */
  onDisconnect?: (e: { event: APIGatewayEvent }) => MaybePromise<void>;

  /**
   * Called on incoming graphql-ws `connection_init` message.
   * Returned value is persisted and provided at context creation on publish events.
   **/
  onConnectionInit?: (e: {
    event: APIGatewayEvent;
    message: ConnectionInitMessage;
  }) => MaybePromise<object>;
  /** Called on incoming graphql-ws `subscribe` message. */
  onSubscribe?: (e: {
    event: APIGatewayEvent;
    message: SubscribeMessage;
  }) => MaybePromise<void>;
  /** Called on graphql-ws `complete` message. */
  onComplete?: (e: {
    event: APIGatewayEvent;
    message: CompleteMessage;
  }) => MaybePromise<void>;
  /** Called on incoming graphql-ws `ping` message. */
  onPing?: (e: {
    event: APIGatewayEvent;
    message: PingMessage;
  }) => MaybePromise<void>;
  /** Called on incoming graphql-ws `pong` message. */
  onPong?: (e: {
    event: APIGatewayEvent;
    message: PongMessage;
  }) => MaybePromise<void>;

  /** Called on unexpected errors during resolution of API Gateway or graphql-ws events. */
  onError?: (error: any, context: any) => void;
};

type MaybePromise<T> = T | Promise<T>;

export type ServerClosure = {
  dynamodbClient: DynamoStore<ConnectionModel>;
  model: {
    Connection: typeof ConnectionModel;
  };
} & Omit<ServerArgs, 'tableNames' | 'dynamodb'>;

type TableNames = {
  connections: string;
  subscriptions: string;
};

export type WebsocketResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
};

export type SubscriptionDefinition = {
  topic: string;
  filter?: object | (() => void);
};

export type SubscribeHandler = (...args: any[]) => SubscribePsuedoIterable;

export type SubscribePsuedoIterable = {
  (): void;
  definitions: SubscriptionDefinition[];
};

export type SubscribeArgs = any[];

export type Class = { new (...args: any[]): any };

export type StateFunctionInput = {
  connectionId: string;
  domainName: string;
  stage: string;
  state: 'PING' | 'REVIEW' | 'ABORT';
  seconds: number;
};
