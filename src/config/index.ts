import dotenv from "dotenv";

dotenv.config();

export const  config ={

    server: {
        host: process.env.HOST,
        port: parseInt(process.env.PORT || "3000",10),
      },
      redis: {
        host: process.env.REDIS_HOST ,
        port: parseInt(process.env.REDIS_PORT || "6379",10),
        password: process.env.REDIS_PASSWORD,
      },
      postgres: {
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || "5432",10),
        database: process.env.POSTGRES_DB ,
        user: process.env.POSTGRES_USER ,
        password: process.env.POSTGRES_PASSWORD,

},
    queue: {
        concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '10', 10),
        maxRetries: parseInt(process.env.QUEUE_MAX_RETRIES || '3', 10),
        backoffDelay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '1000', 10),
    },

    order: {
        defaultSlippage: process.env.DEFAULT_SLIPPAGE ,
        activeOrderTTL: process.env.ACTIVE_ORDER_TTL,
    },
    solana:{
        rpcUrl:process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
        walletPvtKey:process.env.WALLET_PRIVATE_KEY || "",
    }

}