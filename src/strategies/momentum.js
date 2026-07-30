import { BaseStrategy } from './base.js';
import { getPrice } from '../market.js';
import { sma } from '../utils/technical.js';

export class MomentumStrategy extends BaseStrategy {
  constructor(genes = {}) {
    super(genes);
    this.name = 'momentum';
    if (!genes.lookbackPeriod) {
      this.genes = MomentumStrategy.getRandomGenes();
    }
  }

  static getRandomGenes() {
    return {
      lookbackPeriod: Math.floor(Math.random() * 20) + 5,
      threshold: Math.random() * 0.05 + 0.01,
      positionSize: Math.random() * 0.3 + 0.1,
    };
  }

  async generateSignals() {
    const tickers = ['AAPL', 'NVDA', 'TSLA', 'SPY'];
    const signals = [];

    for (const ticker of tickers) {
      try {
        const price = await getPrice(ticker);
        // Simplified momentum check - would need historical data
        signals.push({
          ticker,
          action: Math.random() > 0.5 ? 'BUY' : 'HOLD',
          price,
          confidence: Math.random(),
        });
      } catch (e) {
        console.warn(`Momentum signal failed for ${ticker}:`, e.message);
      }
    }

    return signals;
  }

  backtest(prices) {
    const signals = [];
    const { lookbackPeriod, threshold } = this.genes;

    for (let i = lookbackPeriod; i < prices.length; i++) {
      const current = prices[i].close;
      const past = prices[i - lookbackPeriod].close;
      const change = (current - past) / past;

      if (change > threshold) {
        signals.push({ action: 'BUY', price: current, timestamp: prices[i].timestamp });
      } else if (change < -threshold) {
        signals.push({ action: 'SELL', price: current, timestamp: prices[i].timestamp });
      }
    }

    return signals;
  }
}
