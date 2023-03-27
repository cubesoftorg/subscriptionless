import {
  ApiGatewayManagementApiClient,
  DeleteConnectionCommand,
  PostToConnectionCommand,
  PostToConnectionCommandInput,
  DeleteConnectionCommandInput,
} from '@aws-sdk/client-apigatewaymanagementapi';

import { APIGatewayEventRequestContext } from 'aws-lambda';
import {
  ConnectionAckMessage,
  NextMessage,
  CompleteMessage,
  ErrorMessage,
  PingMessage,
  PongMessage,
} from 'graphql-ws';

export const sendMessage = (
  a: {
    message:
      | ConnectionAckMessage
      | NextMessage
      | CompleteMessage
      | ErrorMessage
      | PingMessage
      | PongMessage;
  } & Pick<
    APIGatewayEventRequestContext,
    'connectionId' | 'domainName' | 'stage'
  >
) => {
  const postInput: PostToConnectionCommandInput = {
    ConnectionId: a.connectionId!,
    Data: Buffer.from(JSON.stringify(a.message)),
  };
  const postToConnectionCommand = new PostToConnectionCommand(postInput);
  return new ApiGatewayManagementApiClient({
    apiVersion: 'latest',
    endpoint: `${a.domainName}/${a.stage}`,
  }).send(postToConnectionCommand);
};

export const deleteConnection = (
  a: Pick<
    APIGatewayEventRequestContext,
    'connectionId' | 'domainName' | 'stage'
  >
) => {
  const deleteInput: DeleteConnectionCommandInput = {
    ConnectionId: a.connectionId!,
  };
  const deleteConnectionCommand = new DeleteConnectionCommand(deleteInput);
  return new ApiGatewayManagementApiClient({
    apiVersion: 'latest',
    endpoint: `${a.domainName}/${a.stage}`,
  }).send(deleteConnectionCommand);
};
