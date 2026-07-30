import { BaseStrategy } from './base.js';
import { getPrice } from '../market.js';
import { sma, stdDev } from '../utils/technical.js';

export class MeanReversionStrategy extends BaseStrategy {
  constructor(genes = {}) {
    super(genes);
    this.name = 'meanreversion';
    if (!genes.window) {
      this.genes = MeanReversionStrategy.getRandomGenes();
    }
  }

  static getRandomGenes() {
    return {
      window: Math.floor(Math.random() * 30) + 10,
      stdDevMultiplier: Math.random() * 2 + 1,
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
        console.warn(`Mean reversion signal failed for ${ticker}:`, e.message);
      }
    }

    return signals;
  }

  backtest(prices) {
    const signals = [];
    const { window, stdDevMultiplier } = this.genes;

    for (let i = window; i < prices.length; i++) {
      const slice = prices.slice(i - window, i).map(p => p.close);
      const mean = sma(slice, window);
      const sd = stdDev(slice);
      const current = prices[i].close;
      const zScore = (current - mean) / (sd || 1);

      if (zScore < -stdDevMultiplier) {
        signals.push({ action: 'BUY', price: current, timestamp: prices[i].timestamp });
      } else if (zScore > stdDevMultiplier) {
        signals.push({ action: 'SELL', price: current, timestamp: prices[i].timestamp });
      }
    }

    return signals;
  }
}
