import { PongMessage } from 'graphql-ws';
import { deleteConnection, promisify } from '../utils';
import { MessageHandler } from './types';

/** Handler function for 'pong' message. */
export const pong: MessageHandler<PongMessage> =
  (c) =>
  async ({ event, message }) => {
    try {
      await promisify(() => c.onPong?.({ event, message }));
      await c.dynamodbClient
        .update('connection', event.requestContext.connectionId!)
        .updateAttribute('hasPonged')
        .set(true)
        .exec();
    } catch (err) {
      await promisify(() => c.onError?.(err, { event, message }));
      await deleteConnection(event.requestContext);
    }
  };
