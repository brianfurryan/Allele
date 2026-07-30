# Allele

Self-evolving genetic algorithm agent for Robinhood Chain stock trading.

## What It Does

Allele is an autonomous trading agent that:
- Runs its own wallet on Robinhood Chain
- Evolves trading strategies using genetic algorithms
- Trades tokenized stocks (AAPL, NVDA, TSLA, SPY, etc.)
- Self-improves through backtesting and natural selection
- Optionally uses LLM reasoning for trade decisions

## Architecture

```
src/
├── index.js          # Main entry + evolution bootstrap
├── config.js         # Environment configuration
├── wallet.js         # Viem wallet (Robinhood Chain)
├── market.js         # Price feeds (Yahoo/Bankr/DexScreener)
├── trading.js        # Trading engine
├── portfolio.js      # Position + PnL tracking
├── evolution.js      # Genetic algorithm self-evolution
├── llm.js            # OpenRouter GPT integration
├── strategies/
│   ├── base.js           # Base strategy class
│   ├── momentum.js       # Momentum strategy
│   ├── meanreversion.js  # Mean reversion strategy
│   ├── breakout.js       # Breakout strategy
│   └── index.js          # Strategy registry
└── utils/
    └── technical.js      # RSI, MACD, BB, SMA, EMA
```

## How Evolution Works

1. **Population**: 20 strategy individuals with random parameters
2. **Fitness**: Backtested Sharpe ratio + total return
3. **Selection**: Tournament selection (top 40% survive)
4. **Crossover**: Parameter blending between parents
5. **Mutation**: Gaussian noise on parameters (10% rate)
6. **Generations**: 10 cycles, fittest strategy wins

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your keys

# Run evolution + start trading
npm start

# Run evolution only
npm run evolve

# Start trading with best strategy
npm run trade

# Backtest only
npm run backtest
```

## Strategy Parameters

Each strategy has evolvable parameters:
- **Momentum**: lookbackPeriod, threshold, positionSize
- **Mean Reversion**: window, stdDevMultiplier, positionSize
- **Breakout**: period, volumeThreshold, positionSize

## Risk Management

- Stop-loss: 5% default
- Take-profit: 10% default
- Max position size: 20% of capital
- Portfolio heat map: tracks correlation

## License

MIT
