# Live Counter MegaETH

`live-counter-megaeth` is a fully configured pnpm monorepo that showcases the ultra-fast MegaETH testnet UX. It ships with a Vite + React frontend, an Express backend that signs realtime transactions, and a Solidity/Hardhat smart contract.

## 📦 Architecture

```
packages/
  app/         # Vite + React + Tailwind UI
  server/      # Express API with realtime_sendRawTransaction
  contracts/   # Hardhat + Solidity LiveCounter contract
```

The repository root contains the pnpm workspace, shared ESLint/Prettier/EditorConfig settings, and unified scripts (`pnpm build`, `pnpm dev`, `pnpm test:local`).

## 🚀 Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` → `.env` and add the MegaETH testnet private key plus RPC endpoint (defaults to `https://carrot.megaeth.com/rpc`).

```bash
cp .env.example .env
# edit the file and set a valid PRIVATE_KEY
```

> ⚠️ Use this private key **only** for the MegaETH testnet demo. Production secrets must live in a secure vault.

### 3. Deploy the smart contract

Claim some test tokens from the [MegaETH faucet](https://faucet.megaeth.example) *(placeholder link)* and deploy the contract:

```bash
cd packages/contracts
pnpm hardhat run scripts/deploy.ts --network megaeth
```

The script automatically writes the deployed address to `packages/app/src/contracts.json` so the frontend always has the latest configuration.

### 4. Launch the dev environment

```bash
pnpm dev
```

- Express API runs at `http://localhost:8787`
- Vite dev server runs at `http://localhost:5173`

Open the app, click **Connect Wallet**, and connect MetaMask (or another injected provider) to the MegaETH network (`chainId 6342`).

## 🧪 Local tests

The contracts ship with a lightweight e2e test (`packages/contracts/test/liveCounter.test.ts`) that deploys to a local Hardhat node and asserts the `Incremented` event.

```bash
pnpm test:local
```

## ⚙️ Realtime UX flow

1. The frontend encodes the `increment()` calldata and issues a POST to `/api/realtimeSend`.
2. The Express backend signs the transaction with the `.env` private key and calls `realtime_sendRawTransaction` on the MegaETH RPC.
3. If the realtime API returns a `receipt`, the UI instantly shows “✔ confirmed (Realtime)” and refreshes the counter via `value()`.
4. If realtime fails (e.g., `realtime transaction expired` or any network error), the server falls back to `wallet.sendTransaction` and responds with `txHash`. The frontend switches to polling `provider.getTransactionReceipt` every 300–500 ms until confirmation arrives.

### Verifying realtime responses

On a realtime success you will see JSON like the following in the browser devtools or Express logs:

```json
{
  "receipt": {
    "transactionHash": "0x...",
    "status": "0x1",
    "blockNumber": "0x1234",
    "gasUsed": "0x5208"
  }
}
```

The UI renders the “✔ confirmed (Realtime)” badge immediately, without waiting for additional blocks.

## 🔍 Explorer & resources

- MegaETH Explorer: https://explorer.megaeth.example *(placeholder)*
- RPC: https://carrot.megaeth.com/rpc

## 🛠️ Troubleshooting

| Issue | Fix |
| --- | --- |
| Realtime API returned `realtime transaction expired` | This is expected: the Express server automatically falls back to a normal send, returns `txHash`, and the frontend continues polling until `getTransactionReceipt` resolves. |
| Contract address shows `Not deployed` in the UI | Run the deploy script and make sure `contracts.json` is up to date (no commit required). |
| MetaMask requests a different network | Switch to chainId 6342 or add the MegaETH testnet manually (RPC `https://carrot.megaeth.com/rpc`). |
| Missing testnet funds | Use the faucet (placeholder link above). |

## 🧹 Linting & formatting

```bash
pnpm lint
pnpm format
```

## 📁 Useful scripts

- `pnpm build` — builds all packages (contracts, server, frontend)
- `pnpm dev` — runs Express (8787) and Vite (5173) in parallel
- `pnpm test:local` — local Hardhat test of the contract
