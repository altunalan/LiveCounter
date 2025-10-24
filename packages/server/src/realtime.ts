import { config } from "./config.js";

export interface RealtimeReceipt {
  blockHash: string;
  blockNumber: string;
  contractAddress: string | null;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  from: string;
  gasUsed: string;
  logs: unknown[];
  logsBloom: string;
  status: string;
  to: string | null;
  transactionHash: string;
  transactionIndex: string;
  type: string;
}

export class RealtimeError extends Error {
  code?: number;
  data?: unknown;

  constructor(message: string, code?: number, data?: unknown) {
    super(message);
    this.name = "RealtimeError";
    this.code = code;
    this.data = data;
  }
}

interface RpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface RpcResponse {
  jsonrpc: string;
  id: number;
  result?: { receipt?: RealtimeReceipt };
  error?: RpcError;
}

export async function sendRealtimeRawTx(rawTx: string): Promise<RealtimeReceipt> {
  const response = await fetch(config.rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "realtime_sendRawTransaction",
      params: [rawTx],
    }),
  });

  if (!response.ok) {
    throw new RealtimeError(`Realtime RPC returned ${response.status}`, response.status);
  }

  const payload = (await response.json()) as RpcResponse;

  if (payload.error) {
    throw new RealtimeError(payload.error.message, payload.error.code, payload.error.data);
  }

  const receipt = payload.result?.receipt;

  if (!receipt) {
    throw new RealtimeError("Realtime response missing receipt payload");
  }

  return receipt;
}
