import WebSocket from 'ws';

const API_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/api/orders/execute';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  console.log('\n=== Step 1: Health Check ===');
  const res = await fetch(`${API_URL}/health`);
  const data = await res.json();
  console.log('Status:', data.status);
  console.log('Postgres:', data.checks.postgres);
  console.log('Redis:', data.checks.redis);
  return data.status === 'ok';
}

async function testHttpOrderSubmission() {
  console.log('\n=== Step 2: Submit Order via HTTP ===');
  const res = await fetch(`${API_URL}/api/orders/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 0.001,
      slippage: 0.5,
    }),
  });
  const data = await res.json();
  console.log('Order ID:', data.orderId);
  console.log('Status:', data.status);
  console.log('WebSocket URL:', data.wsUrl);
  return data.orderId;
}

async function testGetOrder(orderId: string) {
  console.log('\n=== Step 3: Get Order Status ===');
  const res = await fetch(`${API_URL}/api/orders/${orderId}`);
  const order = await res.json();
  console.log('Order ID:', order.orderId);
  console.log('Status:', order.status);
  console.log('Token In:', order.tokenIn);
  console.log('Token Out:', order.tokenOut);
  console.log('Amount In:', order.amountIn);
  if (order.selectedDex) console.log('Selected DEX:', order.selectedDex);
  if (order.txHash) console.log('TX Hash:', order.txHash);
  return order;
}

async function testWebSocketFlow(): Promise<void> {
  console.log('\n=== Step 4: WebSocket Order with Live Updates ===');
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const statuses: string[] = [];
    let orderId: string;

    ws.on('open', () => {
      console.log('WebSocket connected');
      console.log('Sending order...');
      ws.send(JSON.stringify({
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 0.001,
        slippage: 0.5,
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      
      if (msg.error) {
        console.log('Error:', msg.error);
        ws.close();
        reject(new Error(msg.error));
        return;
      }

      if (msg.orderId && !orderId) {
        orderId = msg.orderId;
        console.log('Order created:', orderId);
      }

      if (msg.status) {
        statuses.push(msg.status);
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
        
        switch (msg.status) {
          case 'pending':
            console.log(`[${timestamp}] ⏳ PENDING - Order queued`);
            break;
          case 'routing':
            console.log(`[${timestamp}] 🔍 ROUTING - Fetching DEX quotes...`);
            break;
          case 'building':
            console.log(`[${timestamp}] 🔨 BUILDING - Preparing transaction...`);
            break;
          case 'submitted':
            console.log(`[${timestamp}] 📤 SUBMITTED - Transaction sent to network`);
            break;
          case 'confirmed':
            console.log(`[${timestamp}] ✅ CONFIRMED - Transaction successful!`);
            if (msg.txHash) {
              console.log(`   TX: https://explorer.solana.com/tx/${msg.txHash}?cluster=devnet`);
            }
            ws.close();
            break;
          case 'failed':
            console.log(`[${timestamp}] ❌ FAILED - ${msg.error || 'Unknown error'}`);
            ws.close();
            break;
        }
      }
    });

    ws.on('close', () => {
      console.log('WebSocket closed');
      console.log('Status flow:', statuses.join(' → '));
      resolve();
    });

    ws.on('error', (err) => {
      console.log('WebSocket error:', err.message);
      reject(err);
    });

    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('Timeout - closing connection');
        ws.close();
      }
    }, 60000);
  });
}

async function testConcurrentOrders() {
  console.log('\n=== Step 5: Submit 3 Concurrent Orders ===');
  
  const orders = await Promise.all([
    fetch(`${API_URL}/api/orders/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0.001 }),
    }).then(r => r.json()),
    fetch(`${API_URL}/api/orders/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0.002 }),
    }).then(r => r.json()),
    fetch(`${API_URL}/api/orders/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0.003 }),
    }).then(r => r.json()),
  ]);

  orders.forEach((order, i) => {
    console.log(`Order ${i + 1}: ${order.orderId} (${order.status})`);
  });

  return orders.map(o => o.orderId);
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Order Execution Engine - Full Test   ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const healthy = await testHealthCheck();
    if (!healthy) {
      console.log('\n❌ Server not healthy. Make sure Docker is running.');
      process.exit(1);
    }

    const orderId = await testHttpOrderSubmission();
    await sleep(1000);
    
    await testGetOrder(orderId);
    await sleep(500);

    await testWebSocketFlow();
    await sleep(1000);

    const orderIds = await testConcurrentOrders();
    console.log('\nWaiting for orders to process...');
    await sleep(5000);

    console.log('\n=== Final Order Statuses ===');
    for (const id of orderIds) {
      const order = await fetch(`${API_URL}/api/orders/${id}`).then(r => r.json());
      console.log(`${id.slice(0, 8)}... : ${order.status} ${order.txHash ? '✓' : ''}`);
    }

    console.log('\n✅ All tests completed!');
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  }
}

main();
