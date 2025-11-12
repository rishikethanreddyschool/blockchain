const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

// Replace with your contract ABI and address
const ImageRegistryArtifact = require('../artifacts/contracts/ImageRegistry.sol/ImageRegistry.json');
const IMAGEREGISTRY_SEPOLIA_CONTRACT_ADDRESS = "0x51aD5599eCEA6f7D9164aa42fca31Ec0a90EEeD8"; // Sepolia deployment address

const registeredHashes = new Map();

app.post('/register-image', async (req, res) => {
  try {
    const { imageHash } = req.body;

    if (!imageHash) {
      return res.status(400).json({ error: 'Image hash is required.' });
    }

    if (!process.env.VITE_PUBLIC_SEPOLIA_RPC_URL || !process.env.PRIVATE_KEY) {
      console.warn('Blockchain configuration missing. Using in-memory storage.');

      if (registeredHashes.has(imageHash)) {
        return res.status(409).json({ error: 'Image hash already registered.' });
      }

      registeredHashes.set(imageHash, {
        timestamp: Date.now(),
        registered: true
      });

      return res.status(200).json({
        message: 'Image hash stored successfully!',
        inMemory: true
      });
    }

    const provider = new ethers.JsonRpcProvider(process.env.VITE_PUBLIC_SEPOLIA_RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const contract = new ethers.Contract(
      IMAGEREGISTRY_SEPOLIA_CONTRACT_ADDRESS,
      ImageRegistryArtifact.abi,
      signer
    );

    const isRegistered = await contract.isHashRegistered(imageHash);
    if (isRegistered) {
      return res.status(409).json({ error: 'Image hash already registered on blockchain.' });
    }

    const tx = await contract.registerImageHash(imageHash);
    await tx.wait();

    registeredHashes.set(imageHash, {
      timestamp: Date.now(),
      transactionHash: tx.hash,
      registered: true
    });

    res.status(200).json({
      message: 'Image hash registered successfully!',
      transactionHash: tx.hash
    });
  } catch (error) {
    console.error('Error registering image hash:', error);

    if (error.message && error.message.includes('Hash already registered')) {
      return res.status(409).json({ error: 'Image hash already registered on blockchain.' });
    }

    res.status(500).json({
      error: 'Failed to register image hash.',
      details: error.message
    });
  }
});

app.post('/check-hash', async (req, res) => {
  try {
    const { imageHash } = req.body;

    if (!imageHash) {
      return res.status(400).json({ error: 'Image hash is required.' });
    }

    if (registeredHashes.has(imageHash)) {
      return res.status(200).json({ registered: true, inMemory: true });
    }

    if (!process.env.VITE_PUBLIC_SEPOLIA_RPC_URL || !process.env.PRIVATE_KEY) {
      return res.status(200).json({ registered: false });
    }

    const provider = new ethers.JsonRpcProvider(process.env.VITE_PUBLIC_SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(
      IMAGEREGISTRY_SEPOLIA_CONTRACT_ADDRESS,
      ImageRegistryArtifact.abi,
      provider
    );

    const isRegistered = await contract.isHashRegistered(imageHash);

    if (isRegistered) {
      registeredHashes.set(imageHash, {
        timestamp: Date.now(),
        registered: true
      });
    }

    res.status(200).json({ registered: isRegistered });
  } catch (error) {
    console.error('Error checking hash:', error);
    res.status(200).json({ registered: false });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});