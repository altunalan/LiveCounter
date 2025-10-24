import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MEGAETH_RPC = process.env.MEGAETH_RPC || "https://carrot.megaeth.com/rpc";

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : undefined;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    megaeth: {
      url: MEGAETH_RPC,
      chainId: 6342,
      accounts,
    },
  },
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts",
  },
};

export default config;
