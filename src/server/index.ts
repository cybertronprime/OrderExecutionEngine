import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./../config/index.js";
import {pool} from "../db/postgres.js";
import { redis } from "./../db/redis.js";
import websocket from "@fastify/websocket";
import { orderRoutes } from "./routes/orders.js";



export const app = Fastify({ logger: true });
app.register(cors);
app.register(websocket);
app.register(orderRoutes);

app.get("/health", async (request, reply) => {
    const checks:Record<string,string>={}
    try{
        await pool.query('SELECT 1');
        checks.postgres='ok';

    }catch (error){
        checks.postgres='error';
    }
    try{
        await redis.ping();
        checks.redis='ok';
    }catch (error){
        checks.redis='error';
    }
    const status = checks.postgres == 'ok' && checks.redis == 'ok'? "ok" : "error";
    return {status,timestamp:new Date().toISOString(),checks};


});
export async function startServer(){
    await app.listen({port:config.server.port, host:config.server.host});
}

