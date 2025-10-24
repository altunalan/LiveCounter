import { expect } from "chai";
import { ethers } from "hardhat";

describe("LiveCounter", () => {
  async function deploy() {
    const LiveCounter = await ethers.getContractFactory("LiveCounter");
    const contract = await LiveCounter.deploy();
    await contract.waitForDeployment();
    return contract;
  }

  it("increments the counter and emits event", async () => {
    const contract = await deploy();
    const [caller] = await ethers.getSigners();

    await expect(contract.connect(caller).increment())
      .to.emit(contract, "Incremented")
      .withArgs(1n, caller.address);

    const value = await contract.value();
    expect(value).to.equal(1n);
  });
});
