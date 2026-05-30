// Fishan Quantum Engine - Complete Market Detection
// Features: Weekend, Market Hours, Data Freshness, Holiday Detection

const express = require('express');
const axios = require('axios');
const schedule = require('node-schedule');

const app = express();
app.use(express.json());

// ============================================================
// TELEGRAM CONFIGURATION
// ============================================================
const BOT_TOKEN = '8612333145:AAGjfF7yUdzEEQBSA3Fme0LPzedEPF8dk_g';
const CHAT_ID = '-1004232772544';

// ============================================================
// TWELVE DATA API KEY
// ============================================================
const TWELVE_DATA_KEY = 'f1faab21a5e040288845da3a80c15420';

// ============================================================
// COMPLETE MARKET DETECTION SYSTEM
// ============================================================

// Major Forex Holidays (2026)
const FOREX_HOLIDAYS_2026 = [
    '2026-01-01', // New Year's Day
    '2026-01-19', // Martin Luther King Jr. Day
    '2026-02-16', // Presidents' Day
    '2026-04-10', // Good Friday
    '2026-05-25', // Memorial Day
    '2026-07-03', // Independence Day (observed)
    '2026-07-04', // Independence Day
    '2026-09-07', // Labor Day
    '2026-11-26', // Thanksgiving Day
    '2026-12-25', // Christmas Day
];

// Crypto Holidays (None - 24/7)
// Commodity Holidays (Same as forex generally)

function isForexHoliday(date) {
    const dateStr = date.toISOString().split('T')[0];
    return FOREX_HOLIDAYS_2026.includes(dateStr);
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
}

function isForexMarketOpen() {
    const now = new Date();
    const utcNow = new Date(now.toUTCString());
    const day = utcNow.getUTCDay();
    const hour = utcNow.getUTCHours();
    const minutes = utcNow.getUTCMinutes();
    
    // Weekend check
    if (isWeekend(utcNow)) {
        return { open: false, reason: 'Weekend (Saturday/Sunday)' };
    }
    
    // Holiday check
    if (isForexHoliday(utcNow)) {
        return { open: false, reason: 'Forex Holiday' };
    }
    
    // Forex Market Hours: Sunday 22:00 UTC to Friday 22:00 UTC
    // Monday 00:00 to Friday 23:59 is safe
    if (day >= 1 && day <= 5) {
        // Monday 00:00 to Friday 23:59
        return { open: true, reason: 'Regular Hours' };
    }
    
    // Sunday after 22:00 UTC (Sydney open)
    if (day === 0 && hour >= 22) {
        return { open: true, reason: 'Sunday Open (Sydney)' };
    }
    
    return { open: false, reason: 'Outside Trading Hours' };
}

function isCryptoMarketOpen() {
    // Crypto market is ALWAYS open 24/7/365
    return { open: true, reason: '24/7 Market' };
}

function isCommodityMarketOpen(commodityType) {
    const now = new Date();
    const utcNow = new Date(now.toUTCString());
    const day = utcNow.getUTCDay();
    
    // Weekend closed for commodities
    if (isWeekend(utcNow)) {
        return { open: false, reason: 'Weekend - Commodities Closed' };
    }
    
    // Holiday check
    if (isForexHoliday(utcNow)) {
        return { open: false, reason: 'Holiday - Commodities Closed' };
    }
    
    // Gold/Silver: 23:00 Sunday to 22:00 Friday UTC
    if (day >= 1 && day <= 5) {
        return { open: true, reason: 'Regular Hours' };
    }
    
    if (day === 0 && utcNow.getUTCHours() >= 23) {
        return { open: true, reason: 'Sunday Open' };
    }
    
    return { open: false, reason: 'Outside Trading Hours' };
}

function isIndexMarketOpen() {
    const now = new Date();
    const utcNow = new Date(now.toUTCString());
    const day = utcNow.getUTCDay();
    const hour = utcNow.getUTCHours();
    
    // Weekend closed
    if (isWeekend(utcNow)) {
        return { open: false, reason: 'Weekend - Indices Closed' };
    }
    
    // Holiday check
    if (isForexHoliday(utcNow)) {
        return { open: false, reason: 'Holiday - Indices Closed' };
    }
    
    // US Indices: 14:30 to 21:00 UTC (9:30 AM to 4:00 PM EST)
    if (day >= 1 && day <= 5) {
        if (hour >= 14 && hour < 21) {
            return { open: true, reason: 'Regular Hours (US Session)' };
        }
        if (hour >= 8 && hour < 14 && (day === 1 || day === 2 || day === 3 || day === 4 || day === 5)) {
            return { open: false, reason: 'Pre-Market (Limited Liquidity)' };
        }
        return { open: false, reason: 'After Hours' };
    }
    
    return { open: false, reason: 'Market Closed' };
}

function getMarketStatus(assetType, assetName) {
    switch (assetType) {
        case 'crypto':
            return isCryptoMarketOpen();
        case 'commodity':
            return isCommodityMarketOpen(assetName);
        case 'index':
            return isIndexMarketOpen();
        case 'forex':
        default:
            return isForexMarketOpen();
    }
}

// ============================================================
// DATA FRESHNESS CHECK
// ============================================================

function isDataFresh(timestamp, assetType) {
    if (!timestamp) return false;
    
    const lastDate = new Date(timestamp);
    const now = new Date();
    const hoursDiff = (now - lastDate) / (1000 * 60 * 60);
    
    // Different thresholds for different asset types
    switch (assetType) {
        case 'crypto':
            // Crypto data should be fresh within 1 hour
            return hoursDiff <= 1;
        case 'forex':
            // Forex data should be fresh within 4 hours
            return hoursDiff <= 4;
        case 'commodity':
            // Commodity data fresh within 6 hours
            return hoursDiff <= 6;
        case 'index':
            // Index data fresh within 8 hours
            return hoursDiff <= 8;
        default:
            return hoursDiff <= 4;
    }
}

// ============================================================
// TRADING PAIRS WITH CUSTOM SETTINGS
// ============================================================
const SYMBOLS = [
    // Forex (Mon-Fri only)
    { symbol: 'EUR/USD', name: 'EUR/USD', type: 'forex', active: true, marketHours: '24h Weekdays' },
    { symbol: 'GBP/USD', name: 'GBP/USD', type: 'forex', active: true, marketHours: '24h Weekdays' },
    { symbol: 'USD/JPY', name: 'USD/JPY', type: 'forex', active: true, marketHours: '24h Weekdays' },
    { symbol: 'USD/CHF', name: 'USD/CHF', type: 'forex', active: true, marketHours: '24h Weekdays' },
    { symbol: 'USD/CAD', name: 'USD/CAD', type: 'forex', active: true, marketHours: '24h Weekdays' },
    { symbol: 'AUD/USD', name: 'AUD/USD', type: 'forex', active: true, marketHours: '24h Weekdays' },
    { symbol: 'NZD/USD', name: 'NZD/USD', type: 'forex', active: true, marketHours: '24h Weekdays' },
    
    // Commodities (Limited hours)
    { symbol: 'XAU/USD', name: 'GOLD', type: 'commodity', active: true, marketHours: '23:00 Sun - 22:00 Fri' },
    { symbol: 'XAG/USD', name: 'SILVER', type: 'commodity', active: true, marketHours: '23:00 Sun - 22:00 Fri' },
    
    // Crypto (24/7)
    { symbol: 'BTC/USD', name: 'BITCOIN', type: 'crypto', active: true, marketHours: '24/7' },
    { symbol: 'ETH/USD', name: 'ETHEREUM', type: 'crypto', active: true, marketHours: '24/7' },
    { symbol: 'SOL/USD', name: 'SOLANA', type: 'crypto', active: true, marketHours: '24/7' },
    { symbol: 'BNB/USD', name: 'BINANCE', type: 'crypto', active: true, marketHours: '24/7' },
    
    // Indices (Limited hours)
    { symbol: 'SPX', name: 'S&P500', type: 'index', active: true, marketHours: '14:30-21:00 UTC Weekdays' },
    { symbol: 'NDX', name: 'NASDAQ', type: 'index', active: true, marketHours: '14:30-21:00 UTC Weekdays' },
    { symbol: 'DJI', name: 'DOW JONES', type: 'index', active: true, marketHours: '14:30-21:00 UTC Weekdays' },
];

// Timeframes
const TIMEFRAMES = [
    { name: '15m', interval: '15min', minutes: 15, outputsize: 100 },
    { name: '1h', interval: '1h', minutes: 60, outputsize: 100 }
];

// Signal history
let lastSignals = {};
let marketStatusCache = {};

// ============================================================
// FISHAN QUANTUM ENGINE (Simplified but accurate)
// ============================================================

class FishanQuantumEngine {
    constructor() {
        this.emaFast = 9;
        this.emaSlow = 21;
        this.emaBase = 50;
        this.atrLen = 14;
        this.slMult = 1.5;
        this.tp1Mult = 1.0;
        this.tp2Mult = 2.0;
        this.tp3Mult = 3.0;
    }

    calculateEMA(data, period) {
        const k = 2 / (period + 1);
        let ema = [data[0]];
        for (let i = 1; i < data.length; i++) {
            ema.push(data[i] * k + ema[i - 1] * (1 - k));
        }
        return ema;
    }

    calculateRSI(prices, period) {
        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            let diff = prices[prices.length - i] - prices[prices.length - i - 1];
            if (diff > 0) gains += diff;
            else losses -= diff;
        }
        let avgGain = gains / period;
        let avgLoss = losses / period;
        if (avgLoss === 0) return 100;
        let rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    calculateATR(high, low, close, period) {
        let tr = [];
        for (let i = 1; i < high.length; i++) {
            tr.push(Math.max(
                high[i] - low[i],
                Math.abs(high[i] - close[i - 1]),
                Math.abs(low[i] - close[i - 1])
            ));
        }
        let atr = [tr[0]];
        for (let i = 1; i < tr.length; i++) {
            atr.push((atr[i - 1] * (period - 1) + tr[i]) / period);
        }
        return atr;
    }

    calculateScores(data) {
        const { high, low, close } = data;
        
        const emaFast = this.calculateEMA(close, this.emaFast);
        const emaSlow = this.calculateEMA(close, this.emaSlow);
        const emaBase = this.calculateEMA(close, this.emaBase);
        const atr = this.calculateATR(high, low, close, this.atrLen);
        const rsi = this.calculateRSI(close, 14);
        
        const currentFast = emaFast[emaFast.length - 1];
        const currentSlow = emaSlow[emaSlow.length - 1];
        const currentBase = emaBase[emaBase.length - 1];
        const currentAtr = atr[atr.length - 1];
        const currentClose = close[close.length - 1];
        
        let emaBull = 0, emaBear = 0;
        if (currentFast > currentSlow && currentSlow > currentBase) emaBull = 1.0;
        else if (currentFast > currentSlow) emaBull = 0.6;
        else if (currentFast < currentSlow && currentSlow < currentBase) emaBear = 1.0;
        else if (currentFast < currentSlow) emaBear = 0.6;
        
        let rsiBull = 0, rsiBear = 0;
        if (rsi > 50) rsiBull = rsi > 60 ? 1.0 : 0.6;
        else rsiBear = rsi < 40 ? 1.0 : 0.6;
        
        let bullRaw = (emaBull * 60 + rsiBull * 40);
        let bearRaw = (emaBear * 60 + rsiBear * 40);
        
        return { bullScore: bullRaw, bearScore: bearRaw, atr: currentAtr, currentClose };
    }

    generateSignal(symbolData, symbolName, symbolType, timeframe) {
        const { bullScore, bearScore, atr, currentClose } = this.calculateScores(symbolData);
        
        let threshold = 55;
        if (timeframe === '15m') threshold = 55;
        if (timeframe === '1h') threshold = 60;
        
        let signal = null;
        
        if (bullScore >= threshold && bullScore > bearScore) {
            signal = {
                type: 'BUY',
                pair: symbolName,
                timeframe: timeframe,
                entry: currentClose,
                sl: currentClose - atr * this.slMult,
                tp1: currentClose + atr * this.tp1Mult,
                tp2: currentClose + atr * this.tp2Mult,
                tp3: currentClose + atr * this.tp3Mult,
                score: Math.round(bullScore)
            };
        } else if (bearScore >= threshold && bearScore > bullScore) {
            signal = {
                type: 'SELL',
                pair: symbolName,
                timeframe: timeframe,
                entry: currentClose,
                sl: currentClose + atr * this.slMult,
                tp1: currentClose - atr * this.tp1Mult,
                tp2: currentClose - atr * this.tp2Mult,
                tp3: currentClose - atr * this.tp3Mult,
                score: Math.round(bearScore)
            };
        }
        return signal;
    }
}

// ============================================================
// TELEGRAM SENDER WITH MARKET INFO
// ============================================================

async function sendToTelegram(signal, marketStatus, isDataFresh, dataAge) {
    const signalKey = `${signal.pair}_${signal.timeframe}_${signal.type}`;
    const lastSignal = lastSignals[signalKey];
    
    let cooldownMinutes = 60;
    if (signal.timeframe === '15m') cooldownMinutes = 45;
    if (signal.timeframe === '1h') cooldownMinutes = 120;
    
    if (lastSignal && (Date.now() - lastSignal) < cooldownMinutes * 60 * 1000) {
        return false;
    }
    
    const directionEmoji = signal.type === 'BUY' ? '🟢' : '🔴';
    let tfEmoji = '📊';
    if (signal.timeframe === '15m') tfEmoji = '⚡';
    if (signal.timeframe === '1h') tfEmoji = '🐋';
    
    // Market status indicator
    let marketIndicator = '';
    if (!marketStatus.open) {
        marketIndicator = `\n🔴 MARKET ${marketStatus.reason.toUpperCase()} - Signal Ignored!\n`;
    } else if (!isDataFresh) {
        marketIndicator = `\n🟡 STALE DATA (${dataAge.toFixed(1)} hours old) - Signal may be outdated!\n`;
    } else {
        marketIndicator = `\n🟢 MARKET ACTIVE - ${marketStatus.reason}\n`;
    }
    
    const message = `${directionEmoji} ${signal.type} SIGNAL ${directionEmoji}\n━━━━━━━━━━━━━━━━━━━━━━\n📊 Pair: ${signal.pair}\n${tfEmoji} Timeframe: ${signal.timeframe}\n💰 Entry: ${signal.entry.toFixed(5)}\n🛑 SL: ${signal.sl.toFixed(5)}\n🎯 TP1: ${signal.tp1.toFixed(5)} (33%)\n🎯 TP2: ${signal.tp2.toFixed(5)} (33%)\n🎯 TP3: ${signal.tp3.toFixed(5)} (100%)\n⚡ Score: ${signal.score}%${marketIndicator}━━━━━━━━━━━━━━━━━━━━━━\n⚠️ Risk: 1-2% per trade only\n⏰ ${new Date().toLocaleString()}`;
    
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        await axios.post(url, { chat_id: CHAT_ID, text: message });
        console.log(`✅ ${signal.pair} ${signal.timeframe} - ${signal.type} | Market: ${marketStatus.open ? 'Open' : 'Closed'} | Data: ${isDataFresh ? 'Fresh' : 'Stale'}`);
        
        // Only cache if market is open AND data is fresh
        if (marketStatus.open && isDataFresh) {
            lastSignals[signalKey] = Date.now();
        }
        return true;
    } catch (error) {
        console.error(`❌ Failed: ${error.message}`);
        return false;
    }
}

// ============================================================
// DATA FETCH WITH FRESHNESS CHECK
// ============================================================

async function fetchSymbolData(symbol, interval, outputsize = 100) {
    try {
        const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_KEY}`;
        const response = await axios.get(url);
        
        if (response.data && response.data.values && response.data.values.length > 0) {
            const values = response.data.values;
            const lastTimestamp = values[0]?.datetime;
            
            return {
                high: values.map(v => parseFloat(v.high)),
                low: values.map(v => parseFloat(v.low)),
                close: values.map(v => parseFloat(v.close)),
                lastTimestamp: lastTimestamp
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

// ============================================================
// MAIN ENGINE WITH COMPLETE MARKET DETECTION
// ============================================================

async function checkAllSignals() {
    const now = new Date();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 SIGNAL SCAN - ${now.toLocaleString()}`);
    console.log(`${'='.repeat(60)}`);
    
    // Display market status summary
    const forexStatus = isForexMarketOpen();
    const cryptoStatus = isCryptoMarketOpen();
    const commodityStatus = isCommodityMarketOpen('GOLD');
    const indexStatus = isIndexMarketOpen();
    
    console.log(`📊 MARKET STATUS SUMMARY:`);
    console.log(`   Forex: ${forexStatus.open ? '✅ OPEN' : '❌ CLOSED'} (${forexStatus.reason})`);
    console.log(`   Crypto: ${cryptoStatus.open ? '✅ OPEN' : '❌ CLOSED'} (${cryptoStatus.reason})`);
    console.log(`   Commodities: ${commodityStatus.open ? '✅ OPEN' : '❌ CLOSED'} (${commodityStatus.reason})`);
    console.log(`   Indices: ${indexStatus.open ? '✅ OPEN' : '❌ CLOSED'} (${indexStatus.reason})`);
    console.log(`${'='.repeat(60)}`);
    
    const engine = new FishanQuantumEngine();
    let signalsSent = 0;
    let skippedMarket = 0;
    let skippedStaleData = 0;
    
    for (const sym of SYMBOLS) {
        if (!sym.active) continue;
        
        // Check market status for this asset
        const marketStatus = getMarketStatus(sym.type, sym.name);
        
        if (!marketStatus.open) {
            console.log(`⏭️ SKIP: ${sym.name} - Market ${marketStatus.reason}`);
            skippedMarket++;
            continue;
        }
        
        for (const tf of TIMEFRAMES) {
            const data = await fetchSymbolData(sym.symbol, tf.interval, tf.outputsize);
            if (!data) {
                console.log(`⚠️ NO DATA: ${sym.name} ${tf.name}`);
                continue;
            }
            
            // Check data freshness
            const isFresh = isDataFresh(data.lastTimestamp, sym.type);
            const dataAge = data.lastTimestamp ? (new Date() - new Date(data.lastTimestamp)) / (1000 * 60 * 60) : 999;
            
            if (!isFresh && sym.type !== 'crypto') {
                console.log(`⏭️ STALE DATA: ${sym.name} ${tf.name} (${dataAge.toFixed(1)} hours old) - Skipping`);
                skippedStaleData++;
                continue;
            }
            
            const signal = engine.generateSignal(data, sym.name, sym.type, tf.name);
            
            if (signal) {
                const sent = await sendToTelegram(signal, marketStatus, isFresh, dataAge);
                if (sent) signalsSent++;
            }
            
            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
    
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 SCAN SUMMARY:`);
    console.log(`   ✅ Signals Sent: ${signalsSent}`);
    console.log(`   ⏭️ Skipped (Market Closed): ${skippedMarket}`);
    console.log(`   ⏭️ Skipped (Stale Data): ${skippedStaleData}`);
    console.log(`${'='.repeat(60)}\n`);
}

// ============================================================
// STATUS ENDPOINTS
// ============================================================

app.get('/', (req, res) => {
    res.json({
        status: 'running',
        name: 'Fishan Quantum Engine',
        version: '2.0',
        features: ['Market Detection', 'Data Freshness Check', 'Weekend Detection', 'Holiday Detection']
    });
});

app.get('/status', (req, res) => {
    const forexStatus = isForexMarketOpen();
    const cryptoStatus = isCryptoMarketOpen();
    const commodityStatus = isCommodityMarketOpen('GOLD');
    const indexStatus = isIndexMarketOpen();
    
    res.json({
        timestamp: new Date().toISOString(),
        markets: {
            forex: { open: forexStatus.open, reason: forexStatus.reason },
            crypto: { open: cryptoStatus.open, reason: cryptoStatus.reason },
            commodities: { open: commodityStatus.open, reason: commodityStatus.reason },
            indices: { open: indexStatus.open, reason: indexStatus.reason }
        },
        activeSymbols: SYMBOLS.filter(s => s.active).length,
        signalsToday: Object.keys(lastSignals).length
    });
});

// ============================================================
// START ENGINE
// ============================================================

console.log(`
╔══════════════════════════════════════════════════════════════╗
║     FISHAN QUANTUM ENGINE - COMPLETE MARKET DETECTION       ║
╠══════════════════════════════════════════════════════════════╣
║  🤖 Bot: ${BOT_TOKEN.substring(0, 25)}...                   
║  📡 Channel: ${CHAT_ID}                                     
║  🔑 API: ${TWELVE_DATA_KEY.substring(0, 15)}...             
╠══════════════════════════════════════════════════════════════╣
║  📊 MARKET DETECTION FEATURES:                              ║
║     ✅ Weekend Detection (Sat/Sun)                          ║
║     ✅ Holiday Detection (Major Forex Holidays)             ║
║     ✅ Market Hours Detection                               ║
║     ✅ Data Freshness Check (Stale data ignored)            ║
╠══════════════════════════════════════════════════════════════╣
║  📈 ACTIVE SYMBOLS:                                         ║
${SYMBOLS.filter(s => s.active).map(s => `║     ${s.type === 'crypto' ? '🪙' : s.type === 'commodity' ? '🥇' : '📊'} ${s.name.padEnd(12)} (${s.type})`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║  ⏰ Scan Schedule: Every 15 minutes                         ║
║  🌐 Dashboard: http://localhost:3000/status                 ║
╚══════════════════════════════════════════════════════════════╝
`);

// Schedule scans every 15 minutes
schedule.scheduleJob('*/15 * * * *', checkAllSignals);

// First scan after 5 seconds
setTimeout(checkAllSignals, 5000);

app.listen(3000, () => {
    console.log(`\n✅ Engine Started Successfully!`);
    console.log(`📊 Status URL: http://localhost:3000/status\n`);
});