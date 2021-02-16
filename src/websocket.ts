import { Handler, APIGatewayEvent } from 'aws-lambda';
import { GRAPHQL_TRANSPORT_WS_PROTOCOL, MessageType } from 'graphql-ws';
import { ServerClosure, WebsocketResponse } from './types';
import { complete, connection_init, subscribe } from './messages';

export const handleWebSocket = (c: ServerClosure): Handler<APIGatewayEvent, WebsocketResponse> => async (event, context) => {
  if (!event.requestContext) {
    return;
  }

  if (event.requestContext.eventType === 'CONNECT') {
    return {
      statusCode: 200,
      headers: {
        'Sec-WebSocket-Protocol': GRAPHQL_TRANSPORT_WS_PROTOCOL,
      },
      body: '',
    };
  }

  if (event.requestContext.eventType === 'MESSAGE') {
    const message = JSON.parse(event.body);
    
    if (message.type === MessageType.ConnectionInit) {
      await connection_init(c)({ event, message });
      return {
        statusCode: 200,
        body: '',
      };
    }

    if (message.type === MessageType.Subscribe) {
      await subscribe(c)({ event, message });
      return {
        statusCode: 200,
        body: '',
      };
    }

    if (message.type === MessageType.Complete) {
      await complete(c)({ event, message });
      return {
        statusCode: 200,
        body: '',
      };
    }
  }

  if (event.requestContext.eventType === 'DISCONNECT') {
    c.eventTarget.dispatchEvent('ws.disconnect', event);
  }
};
