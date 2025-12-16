import pg from 'pg';
import {read, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname,join } from 'path';
import { config } from '../config/index';
import { Order, OrderStatusType,DexQuote } from '../types/index';
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

export async function createOrder(){}

export async function updateOrder(){}
export async function getOrder(){

}
export async function mapRow(){
    
}