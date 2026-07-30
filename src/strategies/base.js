export class BaseStrategy {
  constructor(genes = {}) {
    this.name = 'base';
    this.genes = genes;
  }

  static getRandomGenes() {
    return {};
  }

  async generateSignals() {
    throw new Error('Must implement generateSignals');
  }

  backtest(prices) {
    throw new Error('Must implement backtest');
  }
}
