import {Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, } from '@solana/web3.js';
import {config} from '../../config/index.js';


let connection:Connection;
let wallet :Keypair;

export function getConnection():Connection{
    if (!connection){
        connection= new Connection(config.solana.rpcUrl, 'confirmed');
    }
    return connection;

}
export function getWallet():Keypair{
    if (!wallet){
        if(!config.solana.walletPvtKey){
            throw new Error("Private key not set in env");
        }
        const pvtKey=JSON.parse(config.solana.walletPvtKey);
        wallet=Keypair.fromSecretKey(Uint8Array.from(pvtKey));

    }
    return wallet;
}

export async function getBalance():Promise<number>{

    const connection=getConnection();
    const wallet= getWallet();
    const balance = await connection.getBalance(wallet.publicKey);
    return balance / LAMPORTS_PER_SOL;

}

export function getPublicKey():PublicKey{

    const wallet=getWallet();
    return wallet.publicKey;

}
