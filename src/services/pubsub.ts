import {Redis} from 'ioredis' ;
import {config} from '../config/index.js' ;

const pubClient = new Redis({host :config.redis.host, port: config.redis.port,});

export async function publishOrderUpdate(orderId:string,status:string,data?:object){

    const message = JSON.stringify({orderId,status,timeStamp:Date.now(),...data});
    await pubClient.publish(`order:${orderId}`,message);

}

export function subscribeToOrder(orderId:string,callback:(msg:string)=>void){

    const subClient = new Redis({host :config.redis.host, port: config.redis.port,});

    subClient.subscribe(`order:${orderId}`);
    subClient.on('message',(_:string,msg:string)=>callback(msg));
    return ()=> {subClient.unsubscribe(); subClient.quit();};




}