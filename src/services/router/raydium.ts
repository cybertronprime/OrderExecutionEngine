import {Raydium , CurveCalculator} from '@raydium-io/raydium-sdk-v2';
import { getConnection, getWallet } from '../solana/wallet.js';
import { DexQuote } from '../../types/index.js';
import BN from 'bn.js';
import { get } from 'http';

const DEFAULT_POOL_ID = 'GoZmddUBTdiyRoGZSfxwX8p5ZNoVhDo42YN996JdDwoi'; // Devnet SOL-USDC for testing

let raydium: Raydium | null  = null;

async function getRaydium():Promise<Raydium>{
    if (!raydium){
        raydium= await Raydium.load({
            owner:getWallet(),
            connection:getConnection(),
            cluster:'devnet',
            blockhashCommitment:'confirmed'

        })
    }
    return raydium;
}
async function getPoolForSwap(amountIn:number,poolId:string ,baseIn:boolean){
    const sdk = await getRaydium();
    const {poolInfo,poolKeys,rpcData}= await sdk.cpmm.getPoolInfoFromRpc(poolId);
    const mintInDecimals = baseIn ?poolInfo.mintA.decimals:poolInfo.mintB.decimals;
    const mintOutDecimals= baseIn ?  poolInfo.mintB.decimals:poolInfo.mintA.decimals;
    const inputAmount= new BN(Math.floor(amountIn * Math.pow(10,mintInDecimals)));
    const tradeFeeRate= new BN(poolInfo.config.tradeFeeRate);
    const [inputReserve, outputReserve ]= baseIn? [rpcData.baseReserve,rpcData.quoteReserve]:[rpcData.quoteReserve,rpcData.baseReserve];
    const swapResult= CurveCalculator.swapBaseInput(inputAmount, inputReserve, outputReserve, tradeFeeRate,  new BN(0), new BN(0), new BN(0), false);
    return {sdk, poolInfo,poolKeys,inputAmount, swapResult, tradeFeeRate, mintOutDecimals};




}
export async function getRaydiumQuote(amountIn:number, poolId=DEFAULT_POOL_ID, baseIn=true):Promise<DexQuote>{
    const {swapResult, tradeFeeRate, mintOutDecimals}=await getPoolForSwap(amountIn,poolId, baseIn);
    const amountOut= swapResult.outputAmount.toNumber() / Math.pow(10,mintOutDecimals);
    const fee= tradeFeeRate.toNumber()/1e6;
    return {dex:'raydium',price:amountOut/amountIn,amountOut,fee,priceImpact:0};


}

export async function executeRaydiumSwap(amountIn:number, slippage:number, poolId=DEFAULT_POOL_ID, baseIn=true):Promise<string>{
    const {sdk, poolInfo, poolKeys, inputAmount, swapResult}=await getPoolForSwap(amountIn, poolId,baseIn);
    const {execute} = await sdk.cpmm.swap({poolInfo,poolKeys,inputAmount, swapResult,slippage,baseIn});
    const {txId}= await execute({sendAndConfirm:true});
    return txId;


}