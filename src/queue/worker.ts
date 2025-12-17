import {Worker, Job} from 'bullmq';
import {config} from "../config/index.js";
import {getOrder,updateOrder} from "../db/postgres.js";
import {cacheOrder} from "../db/redis.js";
import { getQuotes,selectBestDex,executeSwap } from '../services/router/index.js';
import { publishOrderUpdate } from '../services/pubsub.js';
import { OrderStatus } from '../types/index.js';
import { exec } from 'child_process';

async function processOrder(job:Job<{orderId:string;poolId?:string;baseIn?:boolean}>){
    const {orderId,poolId,baseIn}=job.data;
    console.log(`Processing order ${orderId} `)
    const order = await getOrder(orderId);
    if (!order){
        throw new Error(`Order ${orderId} not found`);

    }
    try{
        await updateStatus(orderId,OrderStatus.ROUTING);
        const quotes= await getQuotes(order.amountIn,poolId,baseIn);
        const {bestQuote,reason}=selectBestDex(quotes);
 
        await  updateStatus(orderId,OrderStatus.BUILDING)
        await updateOrder(orderId,OrderStatus.ROUTING,{
            raydiumQuote:quotes.raydium,
            meteoraQuote:quotes.meteora,
            selectedDex:bestQuote.dex,
        })
        await updateStatus(orderId,OrderStatus.SUBMITTED);
        const txHash = await executeSwap(bestQuote.dex, order.amountIn, order.slippage, poolId, baseIn ?? true);
        console.log(`Order ${orderId} submitted with txHash ${txHash}`);

        await updateOrder(orderId,OrderStatus.CONFIRMED,{txHash,amountOut:bestQuote.amountOut});
        await publishOrderUpdate(orderId,OrderStatus.CONFIRMED,{txHash:txHash});

        return {orderId,txHash}



    }
    catch(err){

        if (job.attemptsMade >= config.queue.maxRetries){
            console.log(`Order ${orderId} failed after maximum retries`);
            await updateOrder(orderId,OrderStatus.FAILED,{errorMessage:(err as Error).message});
            await publishOrderUpdate(orderId,OrderStatus.FAILED,{error:(err as Error).message});

        }
        throw err;

    }
}

async function updateStatus(orderId:string, status:string){
    await updateOrder(orderId,status as any);
    await cacheOrder(orderId,{status});
    await publishOrderUpdate(orderId,status);
}

export const worker =new Worker('orders',processOrder,{
    connection:{host:config.redis.host,port:config.redis.port},
    concurrency:config.queue.concurrency,
})

worker.on('completed',(job)=>console.log(`Job ${job.id} completed`));

worker.on('failed',(job,err)=>{
    if (job){
        console.log(`Job ${job.id} failed with error ${err.message}`);
    }
})