import { config } from './config.js';
import { getHistoricalPrices } from './market.js';
import { Portfolio } from './portfolio.js';

export class GeneticAlgorithm {
  constructor(strategyClass, tickers) {
    this.strategyClass = strategyClass;
    this.tickers = tickers;
    this.population = [];
    this.generation = 0;
  }

  initialize() {
    for (let i = 0; i < config.populationSize; i++) {
      this.population.push(this.createIndividual());
    }
  }

  createIndividual() {
    return {
      genes: this.strategyClass.getRandomGenes(),
      fitness: null,
      sharpe: null,
      returns: null,
    };
  }

  async evaluateFitness(individual) {
    const portfolio = new Portfolio();
    portfolio.cash = config.initialCapital;
    const strategy = new this.strategyClass(individual.genes);
    
    let totalReturn = 0;
    let sharpe = 0;

    for (const ticker of this.tickers) {
      const prices = await getHistoricalPrices(ticker, 90);
      if (prices.length < 30) continue;

      const signals = strategy.backtest(prices);
      let capital = config.initialCapital / this.tickers.length;
      let position = null;
      let returns = [];

      for (const signal of signals) {
        if (signal.action === 'BUY' && !position) {
          position = { price: signal.price, shares: capital / signal.price };
        } else if (signal.action === 'SELL' && position) {
          const pnl = (signal.price - position.price) * position.shares;
          returns.push(pnl / capital);
          capital += pnl;
          position = null;
        }
      }

      if (returns.length > 1) {
        const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
        const std = Math.sqrt(returns.reduce((s, r) => s + (r - avg) ** 2, 0) / returns.length);
        sharpe += std > 0 ? avg / std : 0;
        totalReturn += returns.reduce((a, b) => a + b, 0);
      }
    }

    individual.fitness = totalReturn + sharpe;
    individual.sharpe = sharpe;
    individual.returns = totalReturn;
    return individual.fitness;
  }

  select() {
    this.population.sort((a, b) => b.fitness - a.fitness);
    const cutoff = Math.floor(config.populationSize * 0.4);
    return this.population.slice(0, cutoff);
  }

  crossover(parent1, parent2) {
    if (Math.random() > config.crossoverRate) return parent1;
    const child = { genes: {}, fitness: null, sharpe: null, returns: null };
    for (const key of Object.keys(parent1.genes)) {
      child.genes[key] = Math.random() < 0.5 ? parent1.genes[key] : parent2.genes[key];
    }
    return child;
  }

  mutate(individual) {
    for (const key of Object.keys(individual.genes)) {
      if (Math.random() < config.mutationRate) {
        const val = individual.genes[key];
        const noise = (Math.random() - 0.5) * 0.2;
        individual.genes[key] = Math.max(0, val * (1 + noise));
      }
    }
  }

  async evolve() {
    if (this.population.length === 0) this.initialize();

    for (let g = 0; g < config.generations; g++) {
      console.log(`Generation ${g + 1}/${config.generations}`);
      
      for (const individual of this.population) {
        if (individual.fitness === null) {
          await this.evaluateFitness(individual);
        }
      }

      const survivors = this.select();
      const newPopulation = [...survivors];

      while (newPopulation.length < config.populationSize) {
        const p1 = survivors[Math.floor(Math.random() * survivors.length)];
        const p2 = survivors[Math.floor(Math.random() * survivors.length)];
        let child = this.crossover(p1, p2);
        this.mutate(child);
        newPopulation.push(child);
      }

      this.population = newPopulation;
      this.generation++;
    }

    this.population.sort((a, b) => b.fitness - a.fitness);
    return this.population[0];
  }
}
