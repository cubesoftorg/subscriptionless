import { parse } from 'graphql';
import { buildExecutionContext } from 'graphql/execution/execute';
import { constructContext, getResolverAndArgs, promisify } from '../utils';
import { MessageHandler } from './types';

/** Handler function for 'disconnect' message. */
export const disconnect: MessageHandler<null> =
  (c) =>
  async ({ event }) => {
    try {
      await promisify(() => c.onDisconnect?.({ event }));

      const entities = await c.dynamodbClient
        .query()
        .index('gsi1')
        .wherePartitionKey('connection')
        .whereSortKey()
        .equals(event.requestContext.connectionId)
        .execFetchAll();

      const completed = {} as Record<string, boolean>;
      let deletions = [] as Promise<any>[];
      for await (const entity of entities) {
        deletions = [
          ...deletions,
          (async () => {
            // // only call onComplete per subscription
            // if (!completed[entity.subscriptionId]) {
            //   completed[entity.subscriptionId] = true;
            //   const execContext = buildExecutionContext(
            //     c.schema,
            //     parse(entity.subscription.query),
            //     undefined,
            //     await constructContext(c)(entity),
            //     entity.subscription.variables,
            //     entity.subscription.operationName,
            //     undefined
            //   );
            //   if (!('operation' in execContext)) {
            //     throw execContext;
            //   }
            //   const [field, root, args, context, info] =
            //     getResolverAndArgs(c)(execContext);
            //   const onComplete = field.resolve.onComplete;
            //   if (onComplete) {
            //     await onComplete(root, args, context, info);
            //   }
            // }
            // await c.mapper.delete(entity);
          })(),
        ];
      }

      await Promise.all([
        // Delete subscriptions
        ...deletions,
        // Delete connection
        // c.mapper.delete(
        //   assign(new c.model.Connection(), {
        //     id: event.requestContext.connectionId!,
        //   })
        // ),
      ]);
    } catch (err) {
      await promisify(() => c.onError?.(err, { event }));
    }
  };
