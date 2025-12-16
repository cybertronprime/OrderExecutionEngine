CREATE TABLE IF NOT EXISTS orders(

    id UUID PRIMARY KEY DEFAULT gen_random_uuid() ,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    token_in VARCHAR(50)  NOT NULL,
    token_out  VARCHAR(50)  NOT NULL,
    amount_in  DECIMAL(20, 8) NOT NULL,
    amount_out  DECIMAL(20, 8) ,
    slippage DECIMAL(5,4),
    selected_dex VARCHAR(20),
    tx_hash VARCHAR(100),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    raydium_quote JSONB,
    meteora_quote JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);