import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { handleGatewayEvent } from './gateway';
import { ConnectionModel } from './model/connection';
import { publish } from './pubsub/publish';
import { handleStateMachineEvent } from './stateMachineHandler';
import { ServerArgs } from './types';

import { TableNameResolver } from '@shiftcoders/dynamo-easy';

import { DynamoStore, updateDynamoEasyConfig } from '@shiftcoders/dynamo-easy';
export const createInstance = (opts: ServerArgs) => {
  if (opts.ping && opts.ping.interval <= opts.ping.timeout) {
    throw Error('Ping interval value must be larger than ping timeout.');
  }
  const tableNameResolver: TableNameResolver = (tableName: string) => {
    switch (tableName) {
      case 'connections': {
        return opts.tableNames?.connections || 'subscriptionless_connections';
      }
    }
    return tableName;
  };
  updateDynamoEasyConfig({
    tableNameResolver,
  });

  const dynamodb = new DynamoStore(ConnectionModel, opts.dynamodb);
  const closure = {
    ...opts,
    model: {
      Connection: ConnectionModel,
    },
    dynamodbClient: dynamodb,
  } as const;

  return {
    gatewayHandler: handleGatewayEvent(closure),
    stateMachineHandler: handleStateMachineEvent(closure),
    publish: publish(closure),
  };
};

export { prepareResolvers } from './utils';
export * from './pubsub/subscribe';
