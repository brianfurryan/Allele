import { config } from './config.js';
import { agentAddress } from './wallet.js';
import { getPrices } from './market.js';
import { TradingEngine } from './trading.js';
import { Portfolio } from './portfolio.js';
import { GeneticAlgorithm } from './evolution.js';
import { strategies } from './strategies/index.js';

const args = process.argv.slice(2);
const mode = args[0] || '--trade';

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║           ALLELE AGENT v1.0           ║');
  console.log('║   Self-Evolving Stock Trading Agent   ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`Agent Wallet: ${agentAddress}`);
  console.log(`Mode: ${mode}`);

  if (mode === '--evolve' || mode === '--trade') {
    console.log('\n--- Starting Evolution ---');
    const bestStrategies = {};

    for (const [name, StrategyClass] of Object.entries(strategies)) {
      console.log(`\nEvolving ${name} strategy...`);
      const ga = new GeneticAlgorithm(StrategyClass, ['AAPL', 'NVDA', 'TSLA', 'SPY']);
      const best = await ga.evolve();
      bestStrategies[name] = best;
      console.log(`Best ${name}: fitness=${best.fitness?.toFixed(4)}, sharpe=${best.sharpe?.toFixed(4)}, returns=${best.returns?.toFixed(4)}`);
    }

    const overallBest = Object.entries(bestStrategies)
      .sort((a, b) => b[1].fitness - a[1].fitness)[0];
    
    console.log(`\n🏆 Overall Best Strategy: ${overallBest[0]}`);
    console.log(`   Fitness: ${overallBest[1].fitness?.toFixed(4)}`);
    console.log(`   Genes:`, overallBest[1].genes);

    if (mode === '--trade') {
      console.log('\n--- Starting Trading ---');
      const StrategyClass = strategies[overallBest[0]];
      const strategy = new StrategyClass(overallBest[1].genes);
      const portfolio = new Portfolio();
      portfolio.cash = config.initialCapital;
      
      const engine = new TradingEngine(strategy, portfolio);
      
      process.on('SIGINT', () => {
        console.log('\nShutting down...');
        engine.stop();
        const stats = portfolio.getStats();
        if (stats) console.log('Final Stats:', stats);
        process.exit(0);
      });

      await engine.start();
    }
  }

  if (mode === '--backtest') {
    console.log('\n--- Backtest Mode ---');
    const prices = await getPrices();
    console.log('Current Prices:', prices);
  }
}

main().catch(console.error);
