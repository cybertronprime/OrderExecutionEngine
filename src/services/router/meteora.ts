import { DexQuote } from "../../types/index.js";    

const sleep= (delay:number)=> new Promise(r=>setTimeout(r,delay))

export async function getMeteoraQuote(amountIn:number):Promise<DexQuote>{
    await sleep(100 + Math.random()*200);

    const basePrice= 0.0001 // $0.00001
    const variance = 0.97 + Math.random()*0.05;
    const price= basePrice*variance;
    const fee = 0.002;
    const amountOut = amountIn*price *(1-fee);
    return {dex:'meteora', price , amountOut , fee, priceImpact:Math.random()*0.01}


}

export async function executeMeteoraSwap(amountIn:number , slippage:number):Promise<string>{
    await sleep(2000+ Math.random()*1000);
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let txHash = '';
    for (let i=0 ; i<88;i++ ) {

        txHash+= chars[Math.floor(Math.random()*chars.length)];
      
    }
    return txHash;


}