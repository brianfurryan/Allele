import { config } from './config.js';
import { getPrice } from './market.js';

export class TradingEngine {
  constructor(strategy, portfolio) {
    this.strategy = strategy;
    this.portfolio = portfolio;
    this.active = false;
  }

  async start() {
    this.active = true;
    console.log(`Trading engine started with strategy: ${this.strategy.name}`);
    while (this.active) {
      try { await this.evaluatePositions(); await this.checkSignals(); await new Promise(r => setTimeout(r, 60000)); }
      catch (e) { console.error('Trading loop error:', e.message); }
    }
  }

  stop() { this.active = false; console.log('Trading engine stopped'); }

  async evaluatePositions() {
    for (const [ticker, position] of Object.entries(this.portfolio.positions)) {
      const currentPrice = await getPrice(ticker);
      const pnl = (currentPrice - position.entryPrice) / position.entryPrice;
      if (pnl <= -config.stopLossPct) { console.log(`STOP LOSS triggered for ${ticker} at ${pnl.toFixed(4)}`); await this.closePosition(ticker, currentPrice); }
      if (pnl >= config.takeProfitPct) { console.log(`TAKE PROFIT triggered for ${ticker} at ${pnl.toFixed(4)}`); await this.closePosition(ticker, currentPrice); }
    }
  }

  async checkSignals() {
    const signals = await this.strategy.generateSignals();
    for (const signal of signals) {
      if (signal.action === 'BUY' && !this.portfolio.positions[signal.ticker]) { await this.openPosition(signal.ticker, signal.price, signal.confidence); }
      else if (signal.action === 'SELL' && this.portfolio.positions[signal.ticker]) { await this.closePosition(signal.ticker, signal.price); }
    }
  }

  async openPosition(ticker, price, confidence) {
    const size = Math.min(config.maxPositionSize * config.initialCapital, config.initialCapital * confidence * 0.5);
    const shares = size / price;
    this.portfolio.positions[ticker] = { entryPrice: price, shares, size, openedAt: Date.now() };
    console.log(`OPENED ${ticker}: ${shares.toFixed(4)} shares @ $${price.toFixed(2)}`);
  }

  async closePosition(ticker, price) {
    const position = this.portfolio.positions[ticker];
    if (!position) return;
    const pnl = (price - position.entryPrice) * position.shares;
    const pnlPct = (price - position.entryPrice) / position.entryPrice;
    this.portfolio.history.push({ ticker, entryPrice: position.entryPrice, exitPrice: price, shares: position.shares, pnl, pnlPct, duration: Date.now() - position.openedAt, closedAt: Date.now() });
    delete this.portfolio.positions[ticker];
    console.log(`CLOSED ${ticker}: PnL $${pnl.toFixed(2)} (${(pnlPct * 100).toFixed(2)}%)`);
  }
}
