# Allele Skill

Self-evolving genetic algorithm agent for Robinhood Chain stock trading.

## Description

Allele is an autonomous trading agent that evolves its own strategies using genetic algorithms. It runs its own wallet on Robinhood Chain and trades tokenized stocks (AAPL, NVDA, TSLA, SPY, etc.).

## Capabilities

- **Self-Evolution**: Uses genetic algorithms to evolve trading strategies
- **Multiple Strategies**: Momentum, Mean Reversion, Breakout
- **Technical Analysis**: RSI, MACD, Bollinger Bands, SMA, EMA
- **Risk Management**: Stop-loss, take-profit, position sizing
- **LLM Integration**: Optional OpenRouter GPT reasoning
- **Robinhood Chain Native**: Built for tokenized stock trading

## Installation

```bash
# Clone the repo
git clone https://github.com/brianfurryan/Allele.git
cd Allele

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys
```

## Usage

```bash
# Run evolution + start trading
npm start

# Evolution only
npm run evolve

# Trading with best strategy
npm run trade

# Backtest
npm run backtest
```

## Environment Variables

- `ROBINHOOD_RPC_URL` - Robinhood Chain RPC endpoint
- `AGENT_PRIVATE_KEY` - Agent's wallet private key
- `OPENROUTER_API_KEY` - Optional LLM reasoning
- `INITIAL_CAPITAL` - Starting capital (default: 1000)
- `MAX_POSITION_SIZE` - Max position as % of capital (default: 0.2)
- `STOP_LOSS_PCT` - Stop loss % (default: 0.05)
- `TAKE_PROFIT_PCT` - Take profit % (default: 0.1)
- `POPULATION_SIZE` - GA population size (default: 20)
- `GENERATIONS` - GA generations (default: 10)
- `MUTATION_RATE` - GA mutation rate (default: 0.1)
- `CROSSOVER_RATE` - GA crossover rate (default: 0.7)

## Architecture

```
src/
├── index.js          # Main entry
├── config.js         # Environment config
├── wallet.js         # Viem wallet
├── market.js         # Price feeds
├── trading.js        # Trading engine
├── portfolio.js      # PnL tracking
├── evolution.js      # Genetic algorithm
├── llm.js            # OpenRouter integration
├── strategies/       # Trading strategies
└── utils/            # Technical indicators
```

## License

MIT
