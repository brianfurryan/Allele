import fetch from 'node-fetch';
import { config } from './config.js';

const STOCK_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'SPY', 'QQQ', 'MSFT', 'GOOGL', 'AMZN'];

export async function getPrice(ticker) {
  if (config.bankrEnabled) {
    try {
      const res = await fetch(`https://api.bankr.bot/v1/price/${ticker}`);
      if (res.ok) { const data = await res.json(); return parseFloat(data.price); }
    } catch (e) { console.warn(`Bankr API failed for ${ticker}:`, e.message); }
  }
  if (config.yahooEnabled) {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`);
      if (res.ok) { const data = await res.json(); return data.chart.result[0].meta.regularMarketPrice; }
    } catch (e) { console.warn(`Yahoo Finance failed for ${ticker}:`, e.message); }
  }
  if (config.dexscreenerEnabled) {
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${ticker}`);
      if (res.ok) { const data = await res.json(); if (data.pairs?.length) return parseFloat(data.pairs[0].priceUsd); }
    } catch (e) { console.warn(`DexScreener failed for ${ticker}:`, e.message); }
  }
  throw new Error(`Could not fetch price for ${ticker}`);
}

export async function getPrices() {
  const prices = {};
  for (const ticker of STOCK_TICKERS) {
    try { prices[ticker] = await getPrice(ticker); }
    catch (e) { console.error(`Failed to get price for ${ticker}:`, e.message); }
  }
  return prices;
}

export async function getHistoricalPrices(ticker, days = 30) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${days}d`);
    const data = await res.json();
    const timestamps = data.chart.result[0].timestamp;
    const closes = data.chart.result[0].indicators.quote[0].close;
    return timestamps.map((t, i) => ({ timestamp: t * 1000, close: closes[i] })).filter(p => p.close !== null);
  } catch (e) { console.error(`Failed to get historical prices for ${ticker}:`, e.message); return []; }
}
