import { MomentumStrategy } from './momentum.js';
import { MeanReversionStrategy } from './meanreversion.js';
import { BreakoutStrategy } from './breakout.js';

export const strategies = {
  momentum: MomentumStrategy,
  meanreversion: MeanReversionStrategy,
  breakout: BreakoutStrategy,
};
