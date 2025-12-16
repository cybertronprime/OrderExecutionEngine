import {Redis} from 'ioredis';
import {config} from '../config/index.js';
import {Order,OrderStatusType} from '../types/index.js';


const redisParams = {
    host: config.redis.host,
    port: Number(config.redis.port),
    password: config.redis.password,
};
export const redis = new Redis(redisParams);
export const publisher = new Redis(redisParams);
export const subscriber = new Redis(redisParams);
const TTL = config.order.activeOrderTTL;


export async function setActiveOrder(order:Order):Promise<void>{
    const key= `order:${order.orderId}`;
    await redis.hset(key,{orderId:order.orderId,status:order.status,tokenIn:order.tokenIn,tokenOut:order.tokenOut,amountIn:String(order.amountIn),amountOut:String(order.amountOut),slippage:String(order.slippage),createdAt:order.createdAt.toISOString(),updatedAt:order.updatedAt.toISOString()});
    await redis.expire(key,Number(TTL));

}

export async function getActiveOrder(orderId:string) :Promise<Order | null>{
    const orderData = await redis.hgetall(`order:${orderId}`);
    if (!orderData.orderId) {
        return null;
    }
    return { orderId: orderData.orderId, status:orderData.status, tokenIn: orderData.tokenIn, tokenOut: orderData.tokenOut, amountIn: Number(orderData.amountIn), amountOut: Number(orderData.amountOut), slippage: Number(orderData.slippage), createdAt: new Date(orderData.createdAt), updatedAt: new Date(orderData.updatedAt) } as Order;


}

export async function updateReditStatus(orderId: string , status:OrderStatusType):Promise<void> {
    const key = `order:${orderId}`
    await redis.hset(key,{status:status, updatedAt: new Date().toISOString()});
    await redis.expire(key,Number(TTL));


}

export async function deleteActiveOrder(orderId:string):Promise<void>{
    await redis.del(`order:${orderId}`)

}