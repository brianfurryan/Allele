export function sma(data, period) {
  if (data.length < period) return null;
  const sum = data.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

export function ema(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let emaVal = sma(data.slice(0, period), period);
  for (let i = period; i < data.length; i++) {
    emaVal = data[i] * k + emaVal * (1 - k);
  }
  return emaVal;
}

export function rsi(data, period = 14) {
  if (data.length < period + 1) return null;
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[data.length - i] - data[data.length - i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function macd(data, fast = 12, slow = 26, signal = 9) {
  const fastEma = ema(data, fast);
  const slowEma = ema(data, slow);
  if (!fastEma || !slowEma) return null;
  return fastEma - slowEma;
}

export function bollingerBands(data, period = 20, multiplier = 2) {
  const mean = sma(data, period);
  const sd = stdDev(data.slice(-period));
  if (!mean || !sd) return null;
  return {
    upper: mean + multiplier * sd,
    middle: mean,
    lower: mean - multiplier * sd,
  };
}

export function stdDev(data) {
  if (data.length < 2) return 0;
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((s, x) => s + (x - mean) ** 2, 0) / data.length;
  return Math.sqrt(variance);
}
