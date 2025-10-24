# Live Counter MegaETH

Полностью настроенный монорепозиторий `live-counter-megaeth`, демонстрирующий мгновенный UX MegaETH testnet: фронтенд на Vite + React, Express-бэкенд для подписания realtime-транзакций и смарт-контракт на Solidity/Hardhat.

## 📦 Архитектура

```
packages/
  app/         # Vite + React + Tailwind UI
  server/      # Express API с realtime_sendRawTransaction
  contracts/   # Hardhat + Solidity контракт LiveCounter
```

В корне располагаются pnpm-workspace, общие конфиги ESLint/Prettier/EditorConfig и единые скрипты (`pnpm build`, `pnpm dev`, `pnpm test:local`).

## 🚀 Быстрый старт

### 1. Установите зависимости

```bash
pnpm install
```

### 2. Настройте переменные окружения

Скопируйте `.env.example` → `.env` и пропишите приватный ключ аккаунта тестнета MegaETH и RPC (по умолчанию используется `https://carrot.megaeth.com/rpc`).

```bash
cp .env.example .env
# отредактируйте файл и укажите действующий PRIVATE_KEY
```

> ⚠️ Приватный ключ используется **только** на тестнете для демо realtime UX. В продакшене храните ключи в безопасных хранилищах.

### 3. Деплой смарт-контракта

Получите тестовые токены из [MegaETH faucet](https://faucet.megaeth.example) *(плейсхолдер)* и задеплойте контракт:

```bash
cd packages/contracts
pnpm hardhat run scripts/deploy.ts --network megaeth
```

Скрипт автоматически запишет адрес контракта в `packages/app/src/contracts.json`, чтобы фронтенд сразу использовал свежие данные.

### 4. Запуск dev-окружения

```bash
pnpm dev
```

- Express API стартует на `http://localhost:8787`
- Vite dev-сервер доступен на `http://localhost:5173`

Перейдите в браузер и нажмите **Connect Wallet**, чтобы подключить MetaMask (или другой инъектированный провайдер) в сети MegaETH (`chainId 6342`).

## 🧪 Локальные тесты

Контракты покрыты минимальным e2e-тестом (`packages/contracts/test/liveCounter.test.ts`), который деплоит контракт на локальную hardhat-сеть и проверяет событие `Incremented`.

```bash
pnpm test:local
```

## ⚙️ Как работает realtime UX

1. Фронтенд кодирует calldata `increment()` и отправляет POST `/api/realtimeSend`.
2. Express-бэкенд подписывает транзакцию приватным ключом из `.env` и вызывает `realtime_sendRawTransaction` на MegaETH RPC.
3. Если realtime API возвращает объект `receipt`, UI сразу отображает ✔ подтверждено и обновляет значение счётчика через `value()`.
4. Если realtime недоступен (ошибка `realtime transaction expired` или любой сетевой сбой), сервер автоматически отправляет транзу обычным `wallet.sendTransaction` и возвращает `txHash`. Фронт переходит в режим polling, пока `provider.getTransactionReceipt` не вернёт подтверждение.

### Верификация realtime-ответа

При успешном realtime-кейсe в dev-консоли браузера или в сетевом логe Express видно JSON вида:

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

UI сразу покажет бейдж «✔ подтверждено (Realtime)» без ожидания блоков.

## 🔍 Explorer и ресурсы

- MegaETH Explorer: https://explorer.megaeth.example *(плейсхолдер)*
- RPC: https://carrot.megaeth.com/rpc

## 🛠️ Troubleshooting

| Проблема | Решение |
| --- | --- |
| Realtime API вернул ошибку `realtime transaction expired` | Это штатная ситуация: Express автоматически выполнит fallback и вернёт `txHash`, фронт продолжит polling до получения `getTransactionReceipt`. |
| В UI адрес контракта `Not deployed` | Запустите deploy-скрипт, убедитесь, что `contracts.json` обновлён (commit не обязателен). |
| MetaMask ругается на другую сеть | Выберите сеть с `chainId 6342` или добавьте MegaETH testnet вручную (RPC `https://carrot.megaeth.com/rpc`). |
| Нет тестовых токенов | Используйте faucet (ссылка-плейсхолдер выше). |

## 🧹 Линтинг и форматирование

```bash
pnpm lint
pnpm format
```

## 📁 Полезные команды

- `pnpm build` — сборка всех пакетов (контракты, сервер, фронтенд)
- `pnpm dev` — параллельный запуск Express (8787) и Vite (5173)
- `pnpm test:local` — локальный hardhat-тест контракта
