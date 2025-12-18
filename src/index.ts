import { initializeDatabase } from "./db/postgres.js";
import { startServer } from "./server/index.js";
import { config } from "./config/index.js";
import {worker} from "./queue/worker.js";
worker.on('ready', () => console.log('[Worker] Ready to process orders'));
async function main(){

    console.log("Initialising DB");
    console.log('Config:', JSON.stringify(config.postgres, null, 2));
    await initializeDatabase();
    console.log("Starting server");
    await startServer();
}
 
main().catch(console.error);