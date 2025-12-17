export const OrderStatus={
    PENDING:"pending",
    ROUTING: 'routing',
    BUILDING: 'building',
    SUBMITTED: 'submitted',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
} as const;

export type OrderStatusType=typeof OrderStatus[keyof typeof OrderStatus];

export interface  DexQuote{
    dex : 'raydium' | 'meteora',
    price: number,
    amountOut: number,
    fee: number,
    priceImpact: number,


}
export interface Order{
    orderId:string;
    status:OrderStatusType;
    tokenIn:string;
    tokenOut:string;
    amountIn:number;
    amountOut:number;
    slippage:number;
    selectedDex:string;
    txHash?:string;
    errorMessage?:string;
    raydiumQuote?:DexQuote;
    meteoraQuote?:DexQuote;
    createdAt:Date;
    updatedAt:Date;
}
export interface OrderInput{
    tokenIn:string;
    tokenOut:string;
    amountIn:number;
    slippage:number;
    poolId:string;
    baseIn?:boolean;
}
export interface OrderJobData{
    orderId:string;
    
}
export interface OrderJobResult{
    orderId:string;
    status:OrderStatusType;

}
export interface WsMessage{
    orderId:string;
    status:OrderStatusType;
    timestamp:Date;
    data?:{txHash?:string;error?:string;};
}
