import cors from "cors";
import express from "express";
import { JsonRpcProvider, Wallet, ethers, type TransactionRequest } from "ethers";
import { config } from "./config.js";
import { RealtimeError, sendRealtimeRawTx } from "./realtime.js";

type RealtimePayload = {
  to: string;
  data: string;
  gas: string | number;
  value?: string | number;
};

const app = express();
app.use(cors());
app.use(express.json());

const provider = new JsonRpcProvider(config.rpcUrl, {
  chainId: config.chainId,
  name: "megaeth",
});

function requirePrivateKey(): string {
  if (!config.privateKey) {
    throw new Error("PRIVATE_KEY is required to submit transactions");
  }
  return config.privateKey;
}

function toBigInt(value: string | number | undefined): bigint | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "number") {
    return BigInt(value);
  }
  if (value.startsWith("0x") || value.startsWith("0X")) {
    return BigInt(value);
  }
  return BigInt(value);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, chainId: config.chainId });
});

app.post("/api/realtimeSend", async (req, res) => {
  try {
    const body: RealtimePayload = req.body;
    if (!body || !body.to || !body.data || body.gas === undefined) {
      return res.status(400).json({ error: "Missing to, data or gas fields" });
    }

    const privateKey = requirePrivateKey();
    const wallet = new Wallet(privateKey, provider);

    const gasLimit = toBigInt(body.gas);
    if (!gasLimit) {
      return res.status(400).json({ error: "Invalid gas value" });
    }

    const txValue = toBigInt(body.value);

    const [nonce, feeData] = await Promise.all([
      provider.getTransactionCount(wallet.address, "latest"),
      provider.getFeeData(),
    ]);

    const fallbackPriority = ethers.parseUnits("1.5", "gwei");
    const fallbackMax = fallbackPriority * 2n;

    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? fallbackPriority;
    const maxFeePerGas = feeData.maxFeePerGas ?? maxPriorityFeePerGas + fallbackMax;

    const unsignedTx = {
      to: body.to,
      data: body.data,
      nonce,
      gasLimit,
      value: txValue,
      chainId: config.chainId,
      type: 2,
      maxFeePerGas,
      maxPriorityFeePerGas,
    } satisfies TransactionRequest;

    const rawTx = await wallet.signTransaction(unsignedTx);

    try {
      const receipt = await sendRealtimeRawTx(rawTx);
      return res.json({ receipt });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown realtime error";
      console.warn("Realtime submission failed", message);
      if (
        error instanceof RealtimeError &&
        error.message.includes("realtime transaction expired")
      ) {
        // fall through
      }
    }

    const fallbackTx = await wallet.sendTransaction({
      to: body.to,
      data: body.data,
      gasLimit,
      value: txValue,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    return res.json({ txHash: fallbackTx.hash });
  } catch (error) {
    console.error("Failed to handle realtime send", error);
    return res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});
