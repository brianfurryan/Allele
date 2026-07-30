import { BaseStrategy } from './base.js';
import { getPrice } from '../market.js';

export class BreakoutStrategy extends BaseStrategy {
  constructor(genes = {}) {
    super(genes);
    this.name = 'breakout';
    if (!genes.period) {
      this.genes = BreakoutStrategy.getRandomGenes();
    }
  }

  static getRandomGenes() {
    return {
      period: Math.floor(Math.random() * 20) + 10,
      volumeThreshold: Math.random() * 2 + 1,
      positionSize: Math.random() * 0.3 + 0.1,
    };
  }

  async generateSignals() {
    const tickers = ['AAPL', 'NVDA', 'TSLA', 'SPY'];
    const signals = [];

    for (const ticker of tickers) {
      try {
        const price = await getPrice(ticker);
        signals.push({
          ticker,
          action: Math.random() > 0.5 ? 'BUY' : 'HOLD',
          price,
          confidence: Math.random(),
        });
      } catch (e) {
        console.warn(`Breakout signal failed for ${ticker}:`, e.message);
      }
    }

    return signals;
  }

  backtest(prices) {
    const signals = [];
    const { period } = this.genes;

    for (let i = period; i < prices.length; i++) {
      const slice = prices.slice(i - period, i);
      const high = Math.max(...slice.map(p => p.close));
      const low = Math.min(...slice.map(p => p.close));
      const current = prices[i].close;

      if (current > high * 0.99) {
        signals.push({ action: 'BUY', price: current, timestamp: prices[i].timestamp });
      } else if (current < low * 1.01) {
        signals.push({ action: 'SELL', price: current, timestamp: prices[i].timestamp });
      }
    }

    return signals;
  }
}
