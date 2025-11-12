import { ethers } from "ethers";
import ImageRegistryArtifact from "../../artifacts/contracts/ImageRegistry.sol/ImageRegistry.json";

const IMAGEREGISTRY_SEPOLIA_CONTRACT_ADDRESS = "0x51aD5599eCEA6f7D9164aa42fca31Ec0a90EEeD8";

const getImageRegistryContract = async () => {
  if (!import.meta.env.VITE_PUBLIC_SEPOLIA_RPC_URL) {
    throw new Error('Blockchain RPC URL not configured');
  }

  const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_PUBLIC_SEPOLIA_RPC_URL);
  const contract = new ethers.Contract(
    IMAGEREGISTRY_SEPOLIA_CONTRACT_ADDRESS,
    ImageRegistryArtifact.abi,
    provider
  );
  return contract;
};

export const registerImageHash = async (imageHash: string): Promise<void> => {
  if (!import.meta.env.VITE_PUBLIC_SEPOLIA_RPC_URL) {
    throw new Error('Blockchain RPC URL not configured');
  }

  const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_PUBLIC_SEPOLIA_RPC_URL);
  const signer = await provider.getSigner();
  const contract = await getImageRegistryContract();
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.registerImageHash(imageHash);
  await tx.wait();
  console.log("Image hash registered successfully!");
};

export const isHashRegistered = async (imageHash: string): Promise<boolean> => {
  try {
    if (!import.meta.env.VITE_PUBLIC_SEPOLIA_RPC_URL) {
      console.warn('Blockchain RPC URL not configured, checking backend');
      return checkHashViaBackend(imageHash);
    }

    const contract = await getImageRegistryContract();
    const registered = await contract.isHashRegistered(imageHash);
    return registered;
  } catch (error: any) {
    console.error('Error checking blockchain registration:', error);
    return checkHashViaBackend(imageHash);
  }
};

export const checkHashViaBackend = async (imageHash: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3001/check-hash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageHash }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.registered || false;
  } catch (error) {
    console.warn('Backend hash check failed:', error);
    return false;
  }
};
