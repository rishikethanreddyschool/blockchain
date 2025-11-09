import { ethers } from "ethers";
import * as ImageRegistryArtifact from "../artifacts/contracts/ImageRegistry.sol/ImageRegistry.json";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

  // Deploy ImageRegistry
  const ImageRegistry = new ethers.ContractFactory(
    ImageRegistryArtifact.abi,
    ImageRegistryArtifact.bytecode,
    signer
  );
  const imageRegistry = await ImageRegistry.deploy();
  await imageRegistry.waitForDeployment();
  console.log("ImageRegistry deployed to:", await imageRegistry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});