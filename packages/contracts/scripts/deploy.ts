import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer available");
  }

  console.log(`Deploying LiveCounter with ${deployer.address}...`);
  const LiveCounter = await ethers.getContractFactory("LiveCounter");
  const contract = await LiveCounter.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`LiveCounter deployed at ${address}`);

  const contractsPath = path.resolve(__dirname, "../../app/src/contracts.json");
  const metadata = {
    LiveCounter: {
      address,
      network: network.name,
      chainId: network.config.chainId ?? null,
    },
  };

  fs.mkdirSync(path.dirname(contractsPath), { recursive: true });
  fs.writeFileSync(contractsPath, JSON.stringify(metadata, null, 2));
  console.log(`Saved contract metadata to ${contractsPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
