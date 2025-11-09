import { ethers } from "ethers";
import ImageRegistryArtifact from "../../artifacts/contracts/ImageRegistry.sol/ImageRegistry.json";

const IMAGEREGISTRY_SEPOLIA_CONTRACT_ADDRESS = "0x51aD5599eCEA6f7D9164aa42fca31Ec0a90EEeD8"; // Sepolia deployment address

const getImageRegistryContract = async () => {
  const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_PUBLIC_SEPOLIA_RPC_URL);
  const contract = new ethers.Contract(
    IMAGEREGISTRY_SEPOLIA_CONTRACT_ADDRESS,
    ImageRegistryArtifact.abi,
    provider
  );
  return contract;
};

export const registerImageHash = async (imageHash: string): Promise<void> => {
  const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_PUBLIC_SEPOLIA_RPC_URL);
  const signer = await provider.getSigner();
  const contract = await getImageRegistryContract();
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.registerImageHash(imageHash);
  await tx.wait();
  console.log("Image hash registered successfully!");
};

export const isHashRegistered = async (imageHash: string): Promise<boolean> => {
  const contract = await getImageRegistryContract();
  const registered = await contract.isHashRegistered(imageHash);
  return registered;
};