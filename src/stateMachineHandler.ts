import { MessageType } from 'graphql-ws';
import { ConnectionModel } from './model/connection';
import { ServerClosure, StateFunctionInput } from './types';
import { sendMessage, deleteConnection } from './utils';

export const handleStateMachineEvent =
  (c: ServerClosure) =>
  async (input: StateFunctionInput): Promise<StateFunctionInput> => {
    // Initial state - send ping message
    if (input.state === 'PING') {
      await sendMessage({ ...input, message: { type: MessageType.Ping } });

      // On missing skip???
      await c.dynamodbClient
        .update('connection', input.connectionId)
        .updateAttribute('hasPonged')
        .set(false)
        .exec();
      return {
        ...input,
        state: 'REVIEW',
        seconds: c.ping!.timeout,
      };
    }

    // Follow up state - check if pong was returned
    const conn = await c.dynamodbClient
      .get('connection', input.connectionId)
      .exec();

    if (conn?.hasPonged) {
      return {
        ...input,
        state: 'REVIEW',
        seconds: c.ping?.interval!,
      };
    }
    if (conn?.hasPonged) {
      return {
        ...input,
        state: 'PING',
        seconds: c.ping?.interval! - c.ping!.timeout,
      };
    }

    await deleteConnection({ ...input });
    return {
      ...input,
      state: 'ABORT',
    };
  };
