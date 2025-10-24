import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, Interface, formatUnits } from "ethers";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import contracts from "../contracts.json";
import { liveCounterAbi } from "../lib/liveCounterAbi";

type Status = "idle" | "connecting" | "connected" | "sending" | "pending" | "confirmed" | "error";

type RealtimeReceipt = {
  transactionHash?: string;
  hash?: string;
  blockNumber?: string | number;
  gasUsed?: string | bigint;
  status?: string | number;
};

type RealtimeResponse = {
  receipt?: RealtimeReceipt;
  txHash?: string;
  error?: string;
};

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

const CONTRACT_ADDRESS = contracts.LiveCounter?.address;

function CounterCard() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [counter, setCounter] = useState<bigint | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<RealtimeReceipt | null>(null);

  const hasContractAddress = useMemo(() => {
    return Boolean(
      CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000",
    );
  }, []);

  const readOnlyContract = useMemo(() => {
    if (!provider || !hasContractAddress) {
      return null;
    }
    return new Contract(CONTRACT_ADDRESS, liveCounterAbi, provider);
  }, [provider, hasContractAddress]);

  const ensureAddress = useCallback(() => {
    if (!hasContractAddress) {
      toast.error("Deploy the LiveCounter contract and update contracts.json");
      throw new Error("Contract address missing");
    }
    return CONTRACT_ADDRESS;
  }, [hasContractAddress]);

  const refreshCounter = useCallback(async () => {
    try {
      const contract = readOnlyContract;
      if (!contract) {
        return;
      }
      const value: bigint = await contract["value"]();
      setCounter(value);
    } catch (error) {
      console.error("Failed to read counter", error);
      toast.error("Не удалось получить значение счётчика");
    }
  }, [readOnlyContract]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("Web3 кошелёк не найден. Установите MetaMask.");
      return;
    }
    try {
      setStatus("connecting");
      const nextProvider = new BrowserProvider(window.ethereum, { chainId: 6342, name: "megaeth" });
      await nextProvider.send("eth_requestAccounts", []);
      const signer = await nextProvider.getSigner();
      setProvider(nextProvider);
      setAccount(await signer.getAddress());
      setStatus("connected");
      await refreshCounter();
      toast.success("Кошелёк подключен");
    } catch (error) {
      console.error("Failed to connect wallet", error);
      toast.error("Ошибка подключения кошелька");
      setStatus("error");
    }
  }, [refreshCounter]);

  const handleRefresh = useCallback(async () => {
    if (!provider) {
      return toast.error("Сначала подключите кошелёк");
    }
    await refreshCounter();
    toast.success("Значение обновлено");
  }, [provider, refreshCounter]);

  const handleIncrement = useCallback(async () => {
    if (!provider) {
      return toast.error("Сначала подключите кошелёк");
    }
    try {
      setStatus("sending");
      const address = ensureAddress();
      const signer = await provider.getSigner();
      const contract = new Contract(address, liveCounterAbi, signer);
      const gasEstimate = await contract.estimateGas.increment();
      const iface = new Interface(liveCounterAbi);
      const data = iface.encodeFunctionData("increment");

      const response = await fetch("/api/realtimeSend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: address,
          data,
          gas: gasEstimate.toString(),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Realtime send failed");
      }

      const payload = (await response.json()) as RealtimeResponse;

      if (payload.receipt && (payload.receipt.status === "0x1" || payload.receipt.status === 1)) {
        setLastReceipt(payload.receipt);
        setStatus("confirmed");
        toast.success("✔ подтверждено (Realtime)");
        await refreshCounter();
      } else if (payload.txHash) {
        setTxHash(payload.txHash);
        setStatus("pending");
        toast("⏳ подтверждаем…", { icon: "⏳" });
      } else {
        throw new Error(payload.error || "Неизвестный ответ сервера");
      }
    } catch (error) {
      console.error("Failed to increment", error);
      toast.error(error instanceof Error ? error.message : "Ошибка отправки транзакции");
      setStatus("error");
    }
  }, [ensureAddress, provider, refreshCounter]);

  useEffect(() => {
    if (!txHash || !provider) {
      return undefined;
    }

    let cancelled = false;
    const interval = window.setInterval(async () => {
      if (cancelled || !txHash) {
        return;
      }
      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) {
          setLastReceipt({
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            status: receipt.status,
          });
          setStatus("confirmed");
          setTxHash(null);
          toast.success("Транзакция подтверждена");
          await refreshCounter();
        }
      } catch (error) {
        console.warn("Polling error", error);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [txHash, provider, refreshCounter]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "connecting":
        return "Подключаем кошелёк…";
      case "connected":
        return "Кошелёк подключен";
      case "sending":
        return "Отправляем транзакцию…";
      case "pending":
        return "⏳ подтверждаем…";
      case "confirmed":
        return "✔ подтверждено";
      case "error":
        return "Произошла ошибка";
      default:
        return "Готов к работе";
    }
  }, [status]);

  const accountLabel = useMemo(() => {
    if (!account) {
      return "Connect Wallet";
    }
    return `Подключено: ${account.slice(0, 6)}…${account.slice(-4)}`;
  }, [account]);

  const lastReceiptHash = lastReceipt?.transactionHash ?? lastReceipt?.hash ?? "—";
  const lastReceiptBlock = useMemo(() => {
    if (!lastReceipt?.blockNumber) {
      return "—";
    }
    if (typeof lastReceipt.blockNumber === "string") {
      return lastReceipt.blockNumber.startsWith("0x")
        ? parseInt(lastReceipt.blockNumber, 16)
        : lastReceipt.blockNumber;
    }
    return lastReceipt.blockNumber;
  }, [lastReceipt]);

  const lastReceiptGas = useMemo(() => {
    if (!lastReceipt?.gasUsed) {
      return "0";
    }
    return formatUnits(lastReceipt.gasUsed, "gwei");
  }, [lastReceipt]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">LiveCounter</h2>
            <p className="text-sm text-slate-400">
              Адрес контракта: {hasContractAddress ? CONTRACT_ADDRESS : "Not deployed"}
            </p>
          </div>
          <button
            type="button"
            onClick={connectWallet}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {status === "connecting" ? "Подключаем…" : accountLabel}
          </button>
        </div>

        <div className="grid gap-4 rounded-xl bg-slate-900/80 p-6">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-lg">Текущее значение</span>
            <span className="text-4xl font-bold text-white">
              {counter !== null ? counter.toString() : "—"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleIncrement}
              disabled={!account || status === "sending"}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/60"
            >
              <PlusIcon className="h-5 w-5" />
              +1
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Обновить значение
            </button>
            <span className="ml-auto inline-flex items-center gap-2 text-sm text-slate-400">
              {status === "confirmed" ? (
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
              ) : status === "error" ? (
                <ExclamationCircleIcon className="h-5 w-5 text-rose-400" />
              ) : (
                <ArrowPathIcon className="h-5 w-5 animate-spin text-indigo-400" />
              )}
              {statusLabel}
            </span>
          </div>
        </div>

        {lastReceipt ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
            <p className="font-semibold text-slate-200">Последнее подтверждение</p>
            <p className="mt-1 break-words text-slate-400">
              Tx Hash: <span className="font-mono text-slate-200">{lastReceiptHash}</span>
            </p>
            <p className="mt-1 text-slate-400">Блок: {lastReceiptBlock}</p>
            <p className="mt-1 text-slate-400">Gas Used: {lastReceiptGas} Gwei</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CounterCard;
