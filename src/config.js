import dotenv from 'dotenv';
dotenv.config();

export const config = {
  robinhoodRpc: process.env.ROBINHOOD_RPC_URL || 'https://robinhood.chain',
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY,
  openRouterKey: process.env.OPENROUTER_API_KEY,
  initialCapital: parseFloat(process.env.INITIAL_CAPITAL) || 1000,
  maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE) || 0.2,
  stopLossPct: parseFloat(process.env.STOP_LOSS_PCT) || 0.05,
  takeProfitPct: parseFloat(process.env.TAKE_PROFIT_PCT) || 0.1,
  populationSize: parseInt(process.env.POPULATION_SIZE) || 20,
  generations: parseInt(process.env.GENERATIONS) || 10,
  mutationRate: parseFloat(process.env.MUTATION_RATE) || 0.1,
  crossoverRate: parseFloat(process.env.CROSSOVER_RATE) || 0.7,
  yahooEnabled: process.env.YAHOO_FINANCE_ENABLED === 'true',
  bankrEnabled: process.env.BANKR_API_ENABLED === 'true',
  dexscreenerEnabled: process.env.DEXSCREENER_ENABLED === 'true',
};
