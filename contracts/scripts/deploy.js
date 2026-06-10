const { ethers } = require("hardhat");

// Arbitrum Sepolia addresses
const ADDRESSES = {
  // USDC on Arbitrum Sepolia (Circle testnet USDC)
  USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  // Aave V3 Pool on Arbitrum Sepolia
  AAVE_POOL: "0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff",
  // We'll use deployer as treasury for testnet
};

async function main() {
    const signers = await ethers.getSigners();
    const deployer = signers[0];
  console.log("Deploying VELA Protocol with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // 1. Deploy AgentRegistry
  console.log("\n1. Deploying VelaAgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("VelaAgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddr = await agentRegistry.getAddress();
  console.log("   VelaAgentRegistry deployed to:", agentRegistryAddr);

  // 2. Deploy Strategy
  console.log("\n2. Deploying VelaStrategy...");
  const Strategy = await ethers.getContractFactory("VelaStrategy");
  const strategy = await Strategy.deploy();
  await strategy.waitForDeployment();
  const strategyAddr = await strategy.getAddress();
  console.log("   VelaStrategy deployed to:", strategyAddr);

  // 3. Deploy Vault
  console.log("\n3. Deploying VelaVault...");
  const Vault = await ethers.getContractFactory("VelaVault");
  const vault = await Vault.deploy(
    ADDRESSES.USDC,
    ADDRESSES.AAVE_POOL,
    agentRegistryAddr,
    strategyAddr,
    deployer.address // treasury = deployer for testnet
  );
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("   VelaVault deployed to:", vaultAddr);

  // 4. Register Agent wallets
  // These will be the hot wallets used by the Node.js agents
  // For testnet, we'll register the deployer itself as a placeholder
  // Replace with actual agent wallet addresses before production
  console.log("\n4. Registering agents...");

  const maxTxValue = ethers.parseUnits("10000", 6); // 10,000 USDC max per tx

  await agentRegistry.registerAgent(
    deployer.address,           // Replace with SCOUT agent wallet
    0,                          // AgentType.SCOUT
    "VELA Scout",
    maxTxValue,
    false                       // Scout cannot emergency exit
  );
  console.log("   Scout agent registered");

  await agentRegistry.registerAgent(
    deployer.address,           // Replace with ALLOCATOR agent wallet
    1,                          // AgentType.ALLOCATOR
    "VELA Allocator",
    maxTxValue,
    false                       // Allocator cannot emergency exit
  );

  console.log("   Allocator agent registered");
  // NOTE: In production, register separate wallet per agent

  console.log("\n✅ VELA Protocol Deployment Complete!");
  console.log("─────────────────────────────────────────");
  console.log("VelaAgentRegistry:", agentRegistryAddr);
  console.log("VelaStrategy:     ", strategyAddr);
  console.log("VelaVault:        ", vaultAddr);
  console.log("USDC (testnet):   ", ADDRESSES.USDC);
  console.log("Aave Pool:        ", ADDRESSES.AAVE_POOL);
  console.log("─────────────────────────────────────────");
  console.log("\nCopy these addresses into frontend/.env and agents/.env");

  // Write deployment output
  const deploymentInfo = {
    network: "arbitrumSepolia",
    chainId: 421614,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      VelaAgentRegistry: agentRegistryAddr,
      VelaStrategy: strategyAddr,
      VelaVault: vaultAddr,
    },
    externalContracts: {
      USDC: ADDRESSES.USDC,
      AavePool: ADDRESSES.AAVE_POOL,
    },
  };

  const fs = require("fs");
  fs.writeFileSync(
    "./deployments/arbitrumSepolia.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployments/arbitrumSepolia.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });