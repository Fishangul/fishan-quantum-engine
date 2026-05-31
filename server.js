const express = require('express');
const app = express();
app.use(express.json());

// ============================================
// 🔐 CONFIGURATION - APNI VALUES YAHAN DALO
// ============================================
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN || '8977834858:AAE0dFGtVJrCwILZVpOAGdgEkbL3maNYeMk ';
const TELEGRAM_CHAT_ID = process.env.CHAT_ID || '-1004232772544';
const PORT = process.env.PORT || 3000;

// ============================================
// 📨 SEND TO TELEGRAM FUNCTION
// ============================================
async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        const result = await response.json();
        console.log('📤 Telegram response:', result.ok ? '✅ Sent' : '❌ Failed');
        return result.ok;
    } catch (err) {
        console.error('❌ Telegram error:', err.message);
        return false;
    }
}

// ============================================
// 🎨 FORMAT MESSAGE - EXACT FISHAN QUANTUM STYLE
// ============================================
function formatMessage(data) {
    const signalType = data.signal || '';
    const timestamp = new Date().toLocaleString();
    
    // ========================================
    // BUY+ SIGNAL (HIGH CONFLUENCE)
    // ========================================
    if (signalType === 'BUY+') {
        return `🔵 <b>BUY+ SIGNAL</b> 🔵\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `⏰ <b>Time:</b> ${timestamp}\n` +
               `📊 <b>Symbol:</b> ${data.symbol || 'N/A'}\n` +
               `⏱️ <b>Timeframe:</b> ${data.timeframe || 'N/A'}\n` +
               `💰 <b>Entry Price:</b> ${data.entry || data.price || 'N/A'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `🎯 <b>TRADE LEVELS:</b>\n` +
               `   🛑 <b>Stop Loss:</b> ${data.sl || 'N/A'}\n` +
               `   ✅ <b>TP1:</b> ${data.tp1 || 'N/A'} (${data.tp1Mult || '1.0'}R | ${data.tp1Size || '33'}%)\n` +
               `   ✅ <b>TP2:</b> ${data.tp2 || 'N/A'} (${data.tp2Mult || '2.0'}R | ${data.tp2Size || '33'}%)\n` +
               `   🏆 <b>TP3:</b> ${data.tp3 || 'N/A'} (${data.tp3Mult || '3.0'}R | 100%)\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `📈 <b>CONFLUENCE SCORES:</b>\n` +
               `   🟢 Bull Score: ${data.bullScore || '0'}%\n` +
               `   🔴 Bear Score: ${data.bearScore || '0'}%\n` +
               `   ⚡ NCE: ${data.nce || '0'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `🔍 <b>MARKET CONDITIONS:</b>\n` +
               `   🔆 Squeeze: ${data.squeeze || 'OFF'}\n` +
               `   🌐 HTF Trend: ${data.htf || 'NEUTRAL'}\n` +
               `   📊 ADX: ${data.adx || '0'}\n` +
               `   📊 RSI: ${data.rsi || '0'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `<b>#BUYPLUS</b> <b>#${(data.symbol || '').split(':')[0]}</b> <b>#FISHAN_QUANTUM</b>`;
    }
    
    // ========================================
    // SELL+ SIGNAL (HIGH CONFLUENCE)
    // ========================================
    if (signalType === 'SELL+') {
        return `🔴 <b>SELL+ SIGNAL</b> 🔴\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `⏰ <b>Time:</b> ${timestamp}\n` +
               `📊 <b>Symbol:</b> ${data.symbol || 'N/A'}\n` +
               `⏱️ <b>Timeframe:</b> ${data.timeframe || 'N/A'}\n` +
               `💰 <b>Entry Price:</b> ${data.entry || data.price || 'N/A'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `🎯 <b>TRADE LEVELS:</b>\n` +
               `   🛑 <b>Stop Loss:</b> ${data.sl || 'N/A'}\n` +
               `   ✅ <b>TP1:</b> ${data.tp1 || 'N/A'} (${data.tp1Mult || '1.0'}R | ${data.tp1Size || '33'}%)\n` +
               `   ✅ <b>TP2:</b> ${data.tp2 || 'N/A'} (${data.tp2Mult || '2.0'}R | ${data.tp2Size || '33'}%)\n` +
               `   🏆 <b>TP3:</b> ${data.tp3 || 'N/A'} (${data.tp3Mult || '3.0'}R | 100%)\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `📉 <b>CONFLUENCE SCORES:</b>\n` +
               `   🟢 Bull Score: ${data.bullScore || '0'}%\n` +
               `   🔴 Bear Score: ${data.bearScore || '0'}%\n` +
               `   ⚡ NCE: ${data.nce || '0'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `🔍 <b>MARKET CONDITIONS:</b>\n` +
               `   🔆 Squeeze: ${data.squeeze || 'OFF'}\n` +
               `   🌐 HTF Trend: ${data.htf || 'NEUTRAL'}\n` +
               `   📊 ADX: ${data.adx || '0'}\n` +
               `   📊 RSI: ${data.rsi || '0'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `<b>#SELLPLUS</b> <b>#${(data.symbol || '').split(':')[0]}</b> <b>#FISHAN_QUANTUM</b>`;
    }
    
    // ========================================
    // REGULAR BUY SIGNAL
    // ========================================
    if (signalType === 'BUY') {
        return `🟢 <b>BUY SIGNAL</b> 🟢\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `⏰ <b>Time:</b> ${timestamp}\n` +
               `📊 <b>Symbol:</b> ${data.symbol || 'N/A'}\n` +
               `⏱️ <b>Timeframe:</b> ${data.timeframe || 'N/A'}\n` +
               `💰 <b>Price:</b> ${data.price || 'N/A'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `📈 <b>SCORES:</b>\n` +
               `   🟢 Bull: ${data.bullScore || '0'}%\n` +
               `   🔴 Bear: ${data.bearScore || '0'}%\n` +
               `   ⚡ NCE: ${data.nce || '0'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `<b>#BUY</b> <b>#${(data.symbol || '').split(':')[0]}</b> <b>#FISHAN_QUANTUM</b>`;
    }
    
    // ========================================
    // REGULAR SELL SIGNAL
    // ========================================
    if (signalType === 'SELL') {
        return `🔴 <b>SELL SIGNAL</b> 🔴\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `⏰ <b>Time:</b> ${timestamp}\n` +
               `📊 <b>Symbol:</b> ${data.symbol || 'N/A'}\n` +
               `⏱️ <b>Timeframe:</b> ${data.timeframe || 'N/A'}\n` +
               `💰 <b>Price:</b> ${data.price || 'N/A'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `📉 <b>SCORES:</b>\n` +
               `   🟢 Bull: ${data.bullScore || '0'}%\n` +
               `   🔴 Bear: ${data.bearScore || '0'}%\n` +
               `   ⚡ NCE: ${data.nce || '0'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `<b>#SELL</b> <b>#${(data.symbol || '').split(':')[0]}</b> <b>#FISHAN_QUANTUM</b>`;
    }
    
    // ========================================
    // SQUEEZE BREAKOUT ALERT
    // ========================================
    if (signalType === 'SQUEEZE') {
        const direction = data.direction === 'UP' ? '🔼 BULLISH' : '🔽 BEARISH';
        return `⚡ <b>SQUEEZE BREAKOUT</b> ⚡\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `⏰ <b>Time:</b> ${timestamp}\n` +
               `📊 <b>Symbol:</b> ${data.symbol || 'N/A'}\n` +
               `⏱️ <b>Timeframe:</b> ${data.timeframe || 'N/A'}\n` +
               `💰 <b>Price:</b> ${data.price || 'N/A'}\n` +
               `📈 <b>Direction:</b> ${direction}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `<b>#SQUEEZE</b> <b>#${(data.symbol || '').split(':')[0]}</b> <b>#FISHAN_QUANTUM</b>`;
    }
    
    // ========================================
    // TP1 HIT
    // ========================================
    if (signalType === 'TP1_HIT') {
        return `✅ <b>TP1 HIT - PARTIAL PROFIT</b> ✅\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `⏰ <b>Time:</b> ${timestamp}\n` +
               `📊 <b>Symbol:</b> ${data.symbol || 'N/A'}\n` +
               `💰 <b>Price:</b> ${data.price || 'N/A'}\n` +
               `🎯 <b>TP1 Target:</b> ${data.tp1Price || 'N/A'}\n` +
               `📦 <b>Position Closed:</b> ${data.size || '33'}%\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `<b>#TP1</b> <b>#${(data.symbol || '').split(':')[0]}</b> <b>#FISHAN_QUANTUM</b>`;
    }
    
    // ========================================
    // TP2 HIT
    // ========================================
    if (signalType === 'TP2_HIT') {
        return `✅ <b>TP2 HIT - PARTIAL PROFIT</b> ✅\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `⏰ <b>Time:</b> ${timestamp}\n` +
               `📊 <b>Symbol:</b> ${data.symbol || 'N/A'}\n` +
               `💰 <b>Price:</b> ${data.price || 'N/A'}\n` +
               `🎯 <b>TP2 Target:</b> ${data.tp2Price || 'N/A'}\n` +
               `📦 <b>Position Closed:</b> ${data.size || '33'}%\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `<b>#TP2</b> <b>#${(data.symbol || '').split(':')[0]}</b> <b>#FISHAN_QUANTUM</b>`;
    }
    
    // ========================================
    // TP3 HIT (FULL CLOSE)
    // ========================================
    if (signalType === 'TP3_HIT') {
        return `🏆 <b>TP3 HIT - FULL POSITION CLOSED</b> 🏆\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `⏰ <b>Time:</b> ${timestamp}\n` +
               `📊 <b>Symbol:</b> ${data.symbol || 'N/A'}\n` +
               `💰 <b>Price:</b> ${data.price || 'N/A'}\n` +
               `🎯 <b>TP3 Target:</b> ${data.tp3Price || 'N/A'}\n` +
               `📦 <b>Position:</b> 100% Closed\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `<b>#TP3</b> <b>#${(data.symbol || '').split(':')[0]}</b> <b>#FISHAN_QUANTUM</b>`;
    }
    
    // ========================================
    // STOP LOSS HIT
    // ========================================
    if (signalType === 'SL_HIT') {
        return `🛑 <b>STOP LOSS HIT</b> 🛑\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `⏰ <b>Time:</b> ${timestamp}\n` +
               `📊 <b>Symbol:</b> ${data.symbol || 'N/A'}\n` +
               `💰 <b>Price:</b> ${data.price || 'N/A'}\n` +
               `🛑 <b>Stop Loss:</b> ${data.slPrice || 'N/A'}\n` +
               `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
               `<b>#SL</b> <b>#${(data.symbol || '').split(':')[0]}</b> <b>#FISHAN_QUANTUM</b>`;
    }
    
    // ========================================
    // DEFAULT FALLBACK
    // ========================================
    return `📊 <b>FISHAN QUANTUM SIGNAL</b>\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `<code>${JSON.stringify(data, null, 2)}</code>`;
}

// ============================================
// 🌐 WEBHOOK ENDPOINT - MAIN SIGNAL RECEIVER
// ============================================
app.post('/webhook', async (req, res) => {
    const data = req.body;
    const timestamp = new Date().toLocaleString();
    
    console.log('\n' + '='.repeat(50));
    console.log(`📩 WEBHOOK RECEIVED at ${timestamp}`);
    console.log('='.repeat(50));
    console.log('📡 Signal Type:', data.signal || 'UNKNOWN');
    console.log('📊 Data:', JSON.stringify(data, null, 2));
    console.log('='.repeat(50));
    
    // Validate signal
    if (!data.signal) {
        console.log('❌ Invalid signal - missing "signal" field');
        return res.status(400).json({ 
            status: 'error', 
            message: 'Missing signal field',
            received: data 
        });
    }
    
    // Format message for Telegram
    const message = formatMessage(data);
    
    // Send to Telegram
    const success = await sendToTelegram(message);
    
    if (success) {
        console.log(`✅ Signal [${data.signal}] forwarded to Telegram successfully\n`);
        res.json({ 
            status: 'success', 
            signal: data.signal,
            symbol: data.symbol,
            timestamp: timestamp
        });
    } else {
        console.log(`❌ Failed to send [${data.signal}] to Telegram\n`);
        res.status(500).json({ 
            status: 'error', 
            message: 'Telegram send failed',
            signal: data.signal
        });
    }
});

// ============================================
// 🏥 HEALTH CHECK ENDPOINTS
// ============================================
app.get('/', (req, res) => {
    res.json({ 
        status: 'running', 
        service: 'Fishan Quantum Signal Bot',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            webhook: 'POST /webhook',
            health: 'GET /health',
            root: 'GET /'
        }
    });
});

app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        telegram: {
            tokenConfigured: TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE',
            chatIdConfigured: TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE'
        },
        uptime: process.uptime(),
        memory: process.memoryUsage()
    };
    
    res.json(health);
});

// ============================================
// TEST ENDPOINT (for manual testing)
// ============================================
app.post('/test', async (req, res) => {
    const testSignal = req.body.signal || 'BUY+';
    const testData = {
        signal: testSignal,
        symbol: 'BTCUSDT',
        timeframe: '1h',
        price: 52345.67,
        bullScore: 87,
        bearScore: 13,
        nce: 74,
        entry: 52345.67,
        sl: 51800.00,
        tp1: 53100.00,
        tp2: 54100.00,
        tp3: 55800.00,
        tp1Mult: 1.0,
        tp2Mult: 2.0,
        tp3Mult: 3.0,
        tp1Size: 33,
        tp2Size: 33,
        squeeze: 'FIRING',
        htf: 'BULLISH',
        adx: 42,
        rsi: 65
    };
    
    const message = formatMessage(testData);
    const success = await sendToTelegram(message);
    
    res.json({ 
        status: success ? 'success' : 'failed',
        message: 'Test signal sent to Telegram'
    });
});

// ============================================
// 🚀 START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 FISHAN QUANTUM SIGNAL BOT STARTED');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test Endpoint: POST http://localhost:${PORT}/test`);
    console.log('='.repeat(60));
    console.log('✅ Bot is ready to receive signals from TradingView\n');
});