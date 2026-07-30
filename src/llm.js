import fetch from 'node-fetch';
import { config } from './config.js';

export async function llmReasoning(prompt, context = {}) {
  if (!config.openRouterKey) {
    console.warn('No OpenRouter API key configured');
    return null;
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a quantitative trading analyst. Respond with BUY, SELL, or HOLD and a brief reason.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const action = content.match(/\b(BUY|SELL|HOLD)\b/i)?.[0]?.toUpperCase() || 'HOLD';
    const reason = content.replace(/\b(BUY|SELL|HOLD)\b/gi, '').trim();

    return { action, reason, raw: content };
  } catch (e) {
    console.error('LLM reasoning failed:', e.message);
    return null;
  }
}

export async function analyzeMarket(ticker, prices, indicators) {
  const prompt = `
Ticker: ${ticker}
Current Price: $${prices[prices.length - 1]?.close.toFixed(2)}
RSI(14): ${indicators.rsi?.toFixed(2)}
MACD: ${indicators.macd?.toFixed(4)}
SMA(20): ${indicators.sma20?.toFixed(2)}
EMA(50): ${indicators.ema50?.toFixed(2)}

Should we BUY, SELL, or HOLD? Consider momentum, mean reversion, and trend.
`;
  return llmReasoning(prompt);
}
