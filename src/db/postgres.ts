import pg from 'pg';
import {read, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname,join } from 'path';
import { config } from '../config/index.js';
import { Order, OrderStatusType,DexQuote } from '../types/index.js';
import { dir } from 'console';

const {Pool}= pg;
export const pool = new Pool(config.postgres);
export async function initializeDatabase():Promise<void>{

    const filePathName=fileURLToPath(import.meta.url);
    const dirName= dirname(filePathName);
    const sqlFilePath= join(dirName,'schema.sql');
    const schema= readFileSync(sqlFilePath,'utf-8');
    await pool.query(schema);

}

export async function createOrder( orderId:string, tokenIn:string,tokenOut:string,amountIN:number, slippage:number):Promise<Order>{

    const {rows} = await pool.query(
        'INSERT INTO orders (order_id, token_in, token_out, amount_in, slippage) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [orderId,tokenIn, tokenOut, amountIN, slippage]
    );
    return toOrder(rows[0]);
}

export async function updateOrder(orderId:string, status:OrderStatusType, data?:{amountOut?:number;selectedDex?:string;txHash?:string;errorMessage?: string; raydiumQuote?: DexQuote; meteoraQuote?: DexQuote }): Promise<Order | null> {

    const {rows}= await pool.query(
        `UPDATE orders SET status = $2, amount_out = COALESCE($3, amount_out), selected_dex = COALESCE($4, selected_dex), 
        tx_hash = COALESCE($5, tx_hash), error_message = COALESCE($6, error_message), 
        raydium_quote = COALESCE($7, raydium_quote), meteora_quote = COALESCE($8, meteora_quote), 
        updated_at = CURRENT_TIMESTAMP WHERE order_id = $1 RETURNING *`,
        [orderId,status,data?.amountOut,data?.selectedDex,data?.txHash,data?.errorMessage,
        data?.raydiumQuote ? JSON.stringify(data.raydiumQuote) : null,
        data?.meteoraQuote ? JSON.stringify(data.meteoraQuote) : null]

    );
    return rows[0]?toOrder(rows[0]):null;

}
export async function getOrder(orderId:string) :Promise<Order| null>{
    const {rows}= await pool.query(
        `SELECT * FROM orders WHERE order_id= $1`,
        [orderId]);

        return rows[0]?toOrder(rows[0]):null;

}
export async function toOrder(r:any):Promise<Order>{
    return{
        orderId:r.order_id,
        status:r.status,
        tokenIn:r.token_in,
        tokenOut:r.token_out,
        amountIn:r.amount_in,
        amountOut:r.amount_out,
        slippage:r.slippage,
        selectedDex:r.selected_dex,
        txHash:r.tx_hash,
        errorMessage:r.error_message,
        raydiumQuote:r.raydium_quote ,
        meteoraQuote:r.meteora_quote,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
    }

}