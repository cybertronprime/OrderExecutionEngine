import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { createOrder, getOrder } from '../../db/postgres.js';
import { config } from '../../config/index.js';
import { OrderInput } from '../../types/index.js';
import { addOrderJob } from '../../queue/index.js';
import { subscribeToOrder } from '../../services/pubsub.js';

function validateInput(input: OrderInput): string | null {
  const { tokenIn, tokenOut, amountIn } = input;
  if (!tokenIn || !tokenOut) return 'tokenIn and tokenOut required';
  if (!amountIn || amountIn <= 0) return 'amountIn must be positive';
  return null;
}

async function submitOrder(input: OrderInput) {
  const { tokenIn, tokenOut, amountIn, slippage = 0.5, poolId, baseIn } = input;
  const orderId = randomUUID();
  const order = await createOrder(orderId, tokenIn, tokenOut, amountIn, slippage);
  await addOrderJob(orderId, poolId, baseIn);
  return order;
}

export async function orderRoutes(app: FastifyInstance) {
  app.post<{ Body: OrderInput }>('/api/orders/execute', async (req, reply) => {
    const error = validateInput(req.body);
    if (error) return reply.status(400).send({ error });

    const order = await submitOrder(req.body);
    const wsUrl = `ws://${config.server.host}:${config.server.port}/api/orders/execute`;
    return { orderId: order.orderId, status: order.status, wsUrl };
  });

  app.route({
    method: 'GET',
    url: '/api/orders/execute',
    handler: async (_, reply) => reply.status(400).send({ error: 'Use POST or WebSocket' }),
    wsHandler: (socket) => {
      let unsubscribe: (() => void) | null = null;

      socket.on('message', async (data: Buffer) => {
        try {
          const input: OrderInput = JSON.parse(data.toString());
          const error = validateInput(input);
          if (error) return socket.send(JSON.stringify({ error }));
          const order = await submitOrder(input);
          unsubscribe = subscribeToOrder(order.orderId, (msg) => socket.send(msg));
          socket.send(JSON.stringify({ orderId: order.orderId, status: order.status }));
        } catch {
          socket.send(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });

      socket.on('close', () => unsubscribe?.());
    },
  });


  app.get<{ Params: { orderId: string } }>('/api/orders/:orderId', async (req, reply) => {
    const order = await getOrder(req.params.orderId);
    if (!order) return reply.status(404).send({ error: 'Order not found' });
    return order;
  });
}
