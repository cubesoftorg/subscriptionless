import { ConnectionInitMessage, MessageType } from 'graphql-ws';
import { StateFunctionInput } from '../types';
import { sendMessage, deleteConnection, promisify } from '../utils';
import { MessageHandler } from './types';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { ConnectionModel } from '../model/connection';
/** Handler function for 'connection_init' message. */
export const connection_init: MessageHandler<ConnectionInitMessage> =
  (c) =>
  async ({ event, message }) => {
    const client = new SFNClient({ region: 'us-east-2' });
    console.log('Received Init Event', JSON.stringify(event));
    try {
      const res = c.onConnectionInit
        ? await promisify(() => c.onConnectionInit!({ event, message }))
        : message.payload;

      if (c.ping) {
        console.log('Execute ping', JSON.stringify(event));
        const input = {
          connectionId: event.requestContext.connectionId!,
          domainName: event.requestContext.domainName!,
          stage: event.requestContext.stage,
          state: 'PING',
          choice: 'WAIT',
          seconds: c.ping.interval - c.ping.timeout,
        } as StateFunctionInput;
        const command = new StartExecutionCommand({
          input: JSON.stringify(input),
          name: event.requestContext.connectionId!,
          stateMachineArn: c.ping.machineArn,
        });
        return client.send(command);
      }

      // Write to persistence
      const connection = Object.assign(new ConnectionModel(), {
        id: event.requestContext.connectionId!,
        requestContext: event.requestContext,
        payload: res,
      });

      console.log('Save Connection', JSON.stringify(connection));
      await c.dynamodbClient.put(connection).exec();

      console.log('Saved Connection');
      return sendMessage({
        ...event.requestContext,
        message: { type: MessageType.ConnectionAck },
      });
    } catch (err) {
      console.error('ERROR', JSON.stringify(err));
      await promisify(() => c.onError?.(err, { event, message }));
      await deleteConnection(event.requestContext);
    }
  };
