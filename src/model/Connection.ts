import 'reflect-metadata';
import {
  DateProperty,
  Model,
  PartitionKey,
  Property,
  SortKey,
} from '@shiftcoders/dynamo-easy';
import { APIGatewayEventRequestContext } from 'aws-lambda';
import { addHours } from '../utils';

/**
 * Connection established with `connection_init`
 */

@Model({ tableName: 'connection' })
export class ConnectionModel {
  /* ConnectionID */
  @PartitionKey()
  pk: string = 'connection';

  @SortKey()
  @Property({ name: 'sk' })
  id: string;

  /** Time of creation */
  @DateProperty()
  createdAt: Date = new Date();

  /** Request context from $connect event */
  requestContext: APIGatewayEventRequestContext;

  /** connection_init payload (post-parse) */
  payload: Record<string, string>;

  ttl: Date = addHours(new Date(), 3);

  /** has a pong been returned */
  hasPonged: boolean = false;
}
