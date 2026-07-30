export class Portfolio {
  constructor() { this.positions = {}; this.history = []; this.cash = 0; }

  getTotalValue(prices) {
    let total = this.cash;
    for (const [ticker, position] of Object.entries(this.positions)) { if (prices[ticker]) total += position.shares * prices[ticker]; }
    return total;
  }

  getPnL(prices) {
    let unrealized = 0;
    for (const [ticker, position] of Object.entries(this.positions)) { if (prices[ticker]) unrealized += position.shares * (prices[ticker] - position.entryPrice); }
    const realized = this.history.reduce((sum, t) => sum + t.pnl, 0);
    return { unrealized, realized, total: unrealized + realized };
  }

  getStats() {
    if (this.history.length === 0) return null;
    const wins = this.history.filter(t => t.pnl > 0);
    const losses = this.history.filter(t => t.pnl <= 0);
    return {
      totalTrades: this.history.length,
      winRate: wins.length / this.history.length,
      avgWin: wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0,
      avgLoss: losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0,
      avgDuration: this.history.reduce((s, t) => s + t.duration, 0) / this.history.length,
      bestTrade: this.history.reduce((best, t) => t.pnl > best.pnl ? t : best, this.history[0]),
      worstTrade: this.history.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, this.history[0]),
    };
  }
}
