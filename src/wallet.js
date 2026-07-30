import { createWalletClient, http, privateKeyToAccount } from 'viem';
import { robinhood } from 'viem/chains';
import { config } from './config.js';

const account = privateKeyToAccount(config.agentPrivateKey);

export const walletClient = createWalletClient({
  account,
  chain: robinhood,
  transport: http(config.robinhoodRpc),
});

export const agentAddress = account.address;

export async function getBalance() {
  const balance = await walletClient.getBalance({ address: account.address });
  return balance;
}

export async function sendTransaction(to, value, data = '0x') {
  const hash = await walletClient.sendTransaction({ to, value, data });
  return hash;
}
