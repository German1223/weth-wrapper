import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WETH_ABI from './ABI/WETH.json'
import { NETWORK_PARAMS } from './helpers/config';

import './App.css'

const WETH_ADDRESS = import.meta.env.VITE_WETH_ADDRESS

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [ethBalance, setEthBalance] = useState("0");
  const [wethBalance, setWethBalance] = useState("0");
  const [ethAmount, setEthAmount] = useState("");
  const [wethAmount, setWethAmount] = useState("");

  const checkAndSwitchNetwork = async () => {
    try {
      const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
      if (currentChainId !== NETWORK_PARAMS.chainId) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: NETWORK_PARAMS.chainId }]
        });
      }
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [NETWORK_PARAMS]
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      } else {
        console.error("Error when switching network:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      const installMetaMask = confirm(
        "MetaMask not installed. Do you want to install MetaMask?"
      );
      if (installMetaMask) {
        window.open("https://metamask.io/download.html", "_blank");
      }
    }
    try {
      await checkAndSwitchNetwork();

      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      const signerInstance = await providerInstance.getSigner();
      const userAddress = await signerInstance.getAddress();

      setProvider(providerInstance);
      setSigner(signerInstance);
      setAddress(userAddress);
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const updateBalances = async () => {
    if (!signer || !provider) return;

    const ethBalance = ethers.formatEther(await provider.getBalance(address));
    setEthBalance(ethBalance);

    const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI.abi, signer);
    const wethBalance = ethers.formatEther(await wethContract.balanceOf(address));
    setWethBalance(wethBalance);
  };

  const wrapETH = async () => {
    if (!ethAmount || !signer) return;

    const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI.abi, signer);
    const tx = await wethContract.deposit({ value: ethers.parseEther(ethAmount) });
    await tx.wait();
    updateBalances();
    setEthAmount('')
  };

  const unwrapWETH = async () => {
    if (!wethAmount || !signer) return;

    const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI.abi, signer);
    const tx = await wethContract.withdraw(ethers.parseEther(wethAmount));
    await tx.wait();
    updateBalances();
    setWethAmount('')
  };

  useEffect(() => {
    if (signer) {
      updateBalances();
    }
  }, [signer]);

  return (
    <div className='main-cont'>
      <h1>ETH ↔ WETH  Converter</h1>
      <h2>Sepolia network is used</h2>
      {!address ? (
        <button onClick={connectWallet}>Connect MetaMask</button>
      ) : (
        <div>
          <p><b>Account:</b> {address}</p>
          <p><b>ETH balance:</b> {ethBalance} ETH</p>
          <p><b>WETH balance:</b> {wethBalance} WETH</p>

          <div className='wrapper-cont'>
            <div style={{ marginTop: '20px' }}>
              <h3>Wrap ETH to WETH</h3>
              <input
                type="number"
                placeholder="ETH amount"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
              />
              <button onClick={wrapETH}>Wrap</button>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3>Unwrap WETH from ETH</h3>
              <input
                type="number"
                placeholder="WETH amount"
                value={wethAmount}
                onChange={(e) => setWethAmount(e.target.value)}
              />
              <button onClick={unwrapWETH}>Unwrap</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
