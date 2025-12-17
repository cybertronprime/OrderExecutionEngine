import {getRaydiumQuote, executeRaydiumSwap} from "./raydium.js"
import { getMeteoraQuote, executeMeteoraSwap } from "./meteora.js"
import { DexQuote } from "../../types/index.js"
import { e } from "@raydium-io/raydium-sdk-v2/lib/api-1e25e7a5.js";

export interface RoutingResult{
    bestQuote:DexQuote;
    allQuotes:DexQuote[];
    reason:string;
}
export async function getQuotes(amountIn:number, poolId?: string, baseIn?: boolean) :Promise<{raydium?:DexQuote;meteora?:DexQuote}>{

    const quotes:{raydium?:DexQuote;meteora?:DexQuote}={};

    const [raydiumResult, meteoraResult]= await Promise.allSettled ([
        getRaydiumQuote(amountIn, poolId, baseIn),
        getMeteoraQuote(amountIn)
    ]);

    if (raydiumResult.status === 'fulfilled'){
        quotes.raydium=raydiumResult.value;
        console.log("Raydium Quote",raydiumResult.value);
    }else{
        console.log("Raydium Quote Error", raydiumResult.reason);

    }
    if (meteoraResult.status === 'fulfilled'){
        quotes.meteora=meteoraResult.value;
        console.log("Meteora Quote", meteoraResult.value);
    }
    else{
        console.log("Meteora Quote Error", meteoraResult.reason);
    }

    return quotes;
    
}

function effectiveOutput(quote: DexQuote): number {
    return quote.amountOut * (1 - quote.fee);
  }
export function selectBestDex(quotes:{raydium?:DexQuote; meteora?:DexQuote}):RoutingResult{

    const available= [quotes.raydium, quotes.meteora].filter(Boolean) as DexQuote[];
    if (!available.length){
        throw new Error ('No available quotes from any DEX');

    }
    available.sort((a,b)=> effectiveOutput(b)-effectiveOutput(a));
    const best = available[0];
    const reason= available.length===1?`Only one DEX availabe ${best.dex}`:`Best effective output amount ${best.dex}`;

    console.log("Router selected :", best.dex, "with effective output", effectiveOutput(best));

    return {bestQuote:best, allQuotes:available, reason:reason};


}



export async function executeSwap(dex:'raydium' | 'meteora', amountIn:number, slippage:number , poolId?:string, baseIn?:boolean):Promise<string>{
    if (dex==='raydium'){
        return await executeRaydiumSwap (amountIn, slippage, poolId, baseIn);
    }else{
        return await executeMeteoraSwap(amountIn, slippage);
    }
}