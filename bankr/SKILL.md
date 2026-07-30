# Allele - Genetic Algorithm Trading Skill

## Description
Self-evolving genetic algorithm trading agent for Robinhood Chain tokenized stocks. Uses momentum, mean reversion, and breakout strategies that evolve based on performance. Runs on-demand via Bankr native tools.

## Commands

### Analyze a stock
- "run allele on AAPL"
- "analyze TSLA with allele"
- "what does allele think about NVDA"

### Execute trades
- "allele buy $100 of AAPL"
- "allele sell half my SPY"
- "allele trade based on analysis"

### Evolution & portfolio
- "evolve allele strategies"
- "show allele portfolio"
- "allele status"

### Backtest
- "backtest allele on AAPL for 30 days"

## How It Works

1. **Market Data**: Uses Bankr's token research tools to fetch prices and technical data for Robinhood Chain stocks
2. **Technical Analysis**: Calculates RSI, MACD, Bollinger Bands, SMA, EMA using pure JavaScript
3. **Strategy Selection**: Genetic algorithm picks the best strategy (momentum / mean reversion / breakout) based on historical fitness scores
4. **Signal Generation**: Selected strategy generates buy/sell/hold signals
5. **Trade Execution**: Uses Bankr's native swap/trading tools to execute on Robinhood Chain
6. **Evolution**: After each trade, strategy fitness scores update and population evolves

## State Management

Since Bankr is conversational (not persistent), strategy state is stored in:
- `/.memory/allele_state.json` - Population fitness scores, active strategy weights, trade history
- `/.memory/allele_config.json` - User preferences (risk level, capital allocation)

State auto-loads on each command and auto-saves after trades.

## Tools Used

- `lookup_assets` / `get_token_price` - Fetch stock prices on Robinhood Chain
- `smart_swap` / `smart_cross_chain_swap` - Execute trades
- `get_user_balances` - Portfolio tracking
- `create_file` / `read_file` - State persistence in `/.memory/`
- `call_http_endpoint` - Optional LLM reasoning via OpenRouter

## Risk Controls

- Stop-loss: Auto-set via Bankr limit orders
- Position sizing: Max 10% per trade default
- Capital limits: Respects user-configured max allocation
- Confirmation: All trades require explicit user confirmation before execution

## Installation

```
install_skill https://github.com/brianfurryan/Allele
```

## Files

- `SKILL.md` - This file
- `bankr/allele.js` - Main skill logic (genetic algorithm + strategy engine)
- `bankr/strategies.js` - Strategy implementations (momentum, mean reversion, breakout)
- `bankr/technical.js` - Technical indicator calculations
- `bankr/state.js` - State persistence helpers
