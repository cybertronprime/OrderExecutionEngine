import {Queue} from 'bullmq';
import {config} from "../config/index.js";
export const orderQueue = new Queue('orders',{
    connection:{host:config.redis.host, port:config.redis.port},
    defaultJobOptions:{
        attempts: config.queue.maxRetries,
        backoff:{
            type:'fixed',
            delay:config.queue.backoffDelay,
        },
        removeOnComplete: true,
        removeOnFail: false,
    }
})

export async function addOrderJob(orderId:string, poolId?:string,baseIn?:boolean){
    return orderQueue.add("process",{orderId,poolId,baseIn},{jobId  :orderId});}