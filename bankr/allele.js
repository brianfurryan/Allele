// Allele - Bankr Skill Implementation
// Genetic Algorithm Trading Agent for Robinhood Chain

const fs = require('fs');
const path = require('path');

// State paths
const STATE_DIR = '/tmp/allele_state';
const STATE_FILE = path.join(STATE_DIR, 'state.json');
const CONFIG_FILE = path.join(STATE_DIR, 'config.json');

// Ensure state directory exists
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

// Default config
const DEFAULT_CONFIG = {
  initialCapital: 1000,
  stopLossPercent: 5,
  takeProfitPercent: 10,
  maxPositionSize: 0.10, // 10% of capital
  riskLevel: 'medium',    // low, medium, high
  populationSize: 6,
  mutationRate: 0.1
};

// Default population (3 strategies with fitness scores)
const DEFAULT_POPULATION = [
  { name: 'momentum', weight: 0.33, fitness: 50, params: { rsiPeriod: 14, macdFast: 12, macdSlow: 26 } },
  { name: 'meanreversion', weight: 0.33, fitness: 50, params: { bbPeriod: 20, bbStdDev: 2, rsiThreshold: 30 } },
  { name: 'breakout', weight: 0.34, fitness: 50, params: { lookbackPeriod: 20, volumeThreshold: 1.5 } }
];

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading state:', e.message);
  }
  return {
    population: JSON.parse(JSON.stringify(DEFAULT_POPULATION)),
    tradeHistory: [],
    portfolio: {},
    generation: 1
  };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading config:', e.message);
  }
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Technical Indicators
function calculateSMA(data, period) {
  if (data.length < period) return null;
  const sum = data.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (prices.length < period) return null;
  const sma = calculateSMA(prices, period);
  const squaredDiffs = prices.slice(-period).map(p => Math.pow(p - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: sma + (std * stdDev),
    middle: sma,
    lower: sma - (std * stdDev)
  };
}

function calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
  if (prices.length < slow + signal) return null;
  const fastEMA = calculateEMA(prices.slice(-fast - signal), fast);
  const slowEMA = calculateEMA(prices.slice(-slow - signal), slow);
  const macdLine = fastEMA - slowEMA;
  // Simplified signal line
  const signalLine = macdLine * 0.8; // Approximation
  return { macd: macdLine, signal: signalLine, histogram: macdLine - signalLine };
}

// Strategy Implementations
function momentumStrategy(prices, params) {
  const rsi = calculateRSI(prices, params.rsiPeriod || 14);
  const macd = calculateMACD(prices, params.macdFast || 12, params.macdSlow || 26);
  
  if (!rsi || !macd) return { signal: 'HOLD', confidence: 0 };
  
  let score = 0;
  if (rsi > 50 && rsi < 70) score += 1;
  if (macd.histogram > 0) score += 1;
  if (prices[prices.length - 1] > calculateSMA(prices, 20)) score += 1;
  
  const confidence = score / 3;
  if (confidence > 0.6) return { signal: 'BUY', confidence };
  if (confidence < 0.3) return { signal: 'SELL', confidence: 1 - confidence };
  return { signal: 'HOLD', confidence: 0.5 };
}

function meanReversionStrategy(prices, params) {
  const bb = calculateBollingerBands(prices, params.bbPeriod || 20, params.bbStdDev || 2);
  const rsi = calculateRSI(prices, 14);
  
  if (!bb || !rsi) return { signal: 'HOLD', confidence: 0 };
  
  const currentPrice = prices[prices.length - 1];
  let score = 0;
  
  if (currentPrice < bb.lower) score += 1;
  if (rsi < (params.rsiThreshold || 30)) score += 1;
  if (currentPrice < calculateSMA(prices, 20)) score += 1;
  
  const confidence = score / 3;
  if (confidence > 0.6) return { signal: 'BUY', confidence };
  if (currentPrice > bb.upper && rsi > 70) return { signal: 'SELL', confidence: 0.7 };
  return { signal: 'HOLD', confidence: 0.5 };
}

function breakoutStrategy(prices, params) {
  if (prices.length < (params.lookbackPeriod || 20)) return { signal: 'HOLD', confidence: 0 };
  
  const period = params.lookbackPeriod || 20;
  const recentHigh = Math.max(...prices.slice(-period - 5, -5));
  const recentLow = Math.min(...prices.slice(-period - 5, -5));
  const currentPrice = prices[prices.length - 1];
  const volume = 1.0; // Placeholder - would use real volume data
  
  let score = 0;
  if (currentPrice > recentHigh) score += 1;
  if (volume > (params.volumeThreshold || 1.5)) score += 1;
  if (calculateRSI(prices, 14) > 50) score += 1;
  
  const confidence = score / 3;
  if (confidence > 0.6) return { signal: 'BUY', confidence };
  if (currentPrice < recentLow) return { signal: 'SELL', confidence: 0.7 };
  return { signal: 'HOLD', confidence: 0.5 };
}

const STRATEGIES = {
  momentum: momentumStrategy,
  meanreversion: meanReversionStrategy,
  breakout: breakoutStrategy
};

// Genetic Algorithm
function evolvePopulation(state, config) {
  const population = state.population;
  
  // Sort by fitness
  population.sort((a, b) => b.fitness - a.fitness);
  
  // Selection: keep top 50%, mutate rest
  const eliteCount = Math.ceil(population.length * 0.5);
  const elites = population.slice(0, eliteCount);
  
  // Mutate non-elites
  for (let i = eliteCount; i < population.length; i++) {
    const parent = elites[Math.floor(Math.random() * elites.length)];
    population[i] = mutateStrategy(parent, config.mutationRate);
  }
  
  // Normalize weights
  const totalFitness = population.reduce((sum, s) => sum + s.fitness, 0);
  population.forEach(s => {
    s.weight = s.fitness / totalFitness;
  });
  
  state.generation++;
  return state;
}

function mutateStrategy(strategy, mutationRate) {
  const newStrategy = JSON.parse(JSON.stringify(strategy));
  
  Object.keys(newStrategy.params).forEach(key => {
    if (Math.random() < mutationRate) {
      const val = newStrategy.params[key];
      const change = (Math.random() - 0.5) * val * 0.2; // +/- 10% mutation
      newStrategy.params[key] = Math.max(1, Math.round(val + change));
    }
  });
  
  newStrategy.fitness = Math.max(10, newStrategy.fitness - 5); // Reset fitness for new variant
  return newStrategy;
}

// Main Analysis Function
function analyzeTicker(prices, ticker) {
  const state = loadState();
  const config = loadConfig();
  
  if (prices.length < 30) {
    return { error: 'Insufficient price data (need 30+ data points)' };
  }
  
  // Run each strategy
  const results = state.population.map(strat => {
    const strategyFn = STRATEGIES[strat.name];
    if (!strategyFn) return null;
    const result = strategyFn(prices, strat.params);
    return {
      name: strat.name,
      weight: strat.weight,
      fitness: strat.fitness,
      signal: result.signal,
      confidence: result.confidence
    };
  }).filter(Boolean);
  
  // Weighted consensus
  let buyWeight = 0, sellWeight = 0, holdWeight = 0;
  results.forEach(r => {
    const weightedConfidence = r.confidence * r.weight;
    if (r.signal === 'BUY') buyWeight += weightedConfidence;
    else if (r.signal === 'SELL') sellWeight += weightedConfidence;
    else holdWeight += weightedConfidence;
  });
  
  const totalWeight = buyWeight + sellWeight + holdWeight;
  const consensus = {
    BUY: buyWeight / totalWeight,
    SELL: sellWeight / totalWeight,
    HOLD: holdWeight / totalWeight
  };
  
  const finalSignal = Object.entries(consensus).sort((a, b) => b[1] - a[1])[0];
  
  // Technical indicators for display
  const currentPrice = prices[prices.length - 1];
  const rsi = calculateRSI(prices);
  const bb = calculateBollingerBands(prices);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  
  return {
    ticker,
    currentPrice,
    signal: finalSignal[0],
    confidence: Math.round(finalSignal[1] * 100),
    consensus: {
      buy: Math.round(consensus.BUY * 100),
      sell: Math.round(consensus.SELL * 100),
      hold: Math.round(consensus.HOLD * 100)
    },
    indicators: {
      rsi: rsi ? Math.round(rsi * 10) / 10 : null,
      bollinger: bb ? {
        upper: Math.round(bb.upper * 100) / 100,
        middle: Math.round(bb.middle * 100) / 100,
        lower: Math.round(bb.lower * 100) / 100
      } : null,
      sma20: sma20 ? Math.round(sma20 * 100) / 100 : null,
      sma50: sma50 ? Math.round(sma50 * 100) / 100 : null
    },
    strategies: results,
    generation: state.generation,
    recommendation: finalSignal[0] === 'BUY' ? 'Consider buying' : 
                    finalSignal[0] === 'SELL' ? 'Consider selling' : 'Hold position'
  };
}

// Update fitness after trade
function updateFitness(strategyName, pnl) {
  const state = loadState();
  const strategy = state.population.find(s => s.name === strategyName);
  if (strategy) {
    // Update fitness with exponential moving average
    strategy.fitness = strategy.fitness * 0.7 + (50 + pnl * 10) * 0.3;
    strategy.fitness = Math.max(10, Math.min(100, strategy.fitness));
    saveState(state);
  }
}

// Export for Bankr skill usage
module.exports = {
  analyzeTicker,
  evolvePopulation,
  updateFitness,
  loadState,
  saveState,
  loadConfig,
  saveConfig,
  STRATEGIES,
  technical: {
    calculateSMA,
    calculateEMA,
    calculateRSI,
    calculateBollingerBands,
    calculateMACD
  }
};
