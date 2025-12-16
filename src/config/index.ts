import dotenv from "dotenv";

dotenv.config();

export const  config ={

    server: {
        host: process.env.HOST,
        port: process.env.PORT,
      },
      redis: {
        host: process.env.REDIS_HOST ,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
      },
      postgres: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        database: process.env.POSTGRES_DB ,
        user: process.env.POSTGRES_USER ,
        password: process.env.POSTGRES_PASSWORD,

},
order: {
    defaultSlippage: process.env.DEFAULT_SLIPPAGE ,
    activeOrderTTL: process.env.ACTIVE_ORDER_TTL,
  },

}