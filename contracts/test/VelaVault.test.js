const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VELA Protocol", function () {
  let deployer, user1, user2, agentWallet;
  let agentRegistry, strategy, vault;
  let mockUSDC, mockAave;

  const USDC_DECIMALS = 6;
  const ONE_USDC = ethers.parseUnits("1", USDC_DECIMALS);
  const HUNDRED_USDC = ethers.parseUnits("100", USDC_DECIMALS);
  const THOUSAND_USDC = ethers.parseUnits("1000", USDC_DECIMALS);

  beforeEach(async function () {
    [deployer, user1, user2, agentWallet] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", USDC_DECIMALS);
    await mockUSDC.waitForDeployment();

    // Deploy mock Aave Pool
    const MockAave = await ethers.getContractFactory("MockAavePool");
    mockAave = await MockAave.deploy(await mockUSDC.getAddress());
    await mockAave.waitForDeployment();

    // Deploy protocol
    const AgentRegistry = await ethers.getContractFactory("VelaAgentRegistry");
    agentRegistry = await AgentRegistry.deploy();

    const Strategy = await ethers.getContractFactory("VelaStrategy");
    strategy = await Strategy.deploy();

    const Vault = await ethers.getContractFactory("VelaVault");
    vault = await Vault.deploy(
      await mockUSDC.getAddress(),
      await mockAave.getAddress(),
      await agentRegistry.getAddress(),
      await strategy.getAddress(),
      deployer.address
    );

    // Register agent
    const maxTx = ethers.parseUnits("50000", USDC_DECIMALS);
    await agentRegistry.registerAgent(
      agentWallet.address, 1, "VELA Allocator", maxTx, false
    );

    // Also register sentinel with emergency exit
    await agentRegistry.registerAgent(
      deployer.address, 2, "VELA Sentinel", maxTx, true
    );

    // Mint USDC to users
    await mockUSDC.mint(user1.address, THOUSAND_USDC * 10n);
    await mockUSDC.mint(user2.address, THOUSAND_USDC * 10n);
    await mockUSDC.mint(await mockAave.getAddress(), THOUSAND_USDC * 100n);
  });

  describe("Deployment", function () {
    it("Should deploy with correct addresses", async function () {
      expect(await vault.usdc()).to.equal(await mockUSDC.getAddress());
      expect(await vault.agentRegistry()).to.equal(await agentRegistry.getAddress());
    });

    it("Should have 3 strategy templates", async function () {
      const templates = await strategy.getTemplates();
      expect(templates.length).to.equal(3);
      expect(templates[0].name).to.equal("Stable Income");
      expect(templates[1].name).to.equal("Balanced Growth");
      expect(templates[2].name).to.equal("Aggressive Yield");
    });
  });

  describe("Deposits", function () {
    it("Should accept user deposits and mint shares", async function () {
      await mockUSDC.connect(user1).approve(await vault.getAddress(), HUNDRED_USDC);
      await vault.connect(user1).deposit(HUNDRED_USDC, user1.address);

      const shares = await vault.balanceOf(user1.address);
      expect(shares).to.be.gt(0);

      const [, assets] = await vault.getUserInfo(user1.address);
      expect(assets).to.be.closeTo(HUNDRED_USDC, ONE_USDC);
    });

    it("Should reject deposits below minimum", async function () {
      const tooSmall = ethers.parseUnits("0.5", USDC_DECIMALS);
      await mockUSDC.connect(user1).approve(await vault.getAddress(), tooSmall);
      await expect(
        vault.connect(user1).deposit(tooSmall, user1.address)
      ).to.be.revertedWithCustomError(vault, "BelowMinDeposit");
    });

    it("Should track multiple users independently", async function () {
      await mockUSDC.connect(user1).approve(await vault.getAddress(), HUNDRED_USDC);
      await vault.connect(user1).deposit(HUNDRED_USDC, user1.address);

      await mockUSDC.connect(user2).approve(await vault.getAddress(), THOUSAND_USDC);
      await vault.connect(user2).deposit(THOUSAND_USDC, user2.address);

      const [, assets1] = await vault.getUserInfo(user1.address);
      const [, assets2] = await vault.getUserInfo(user2.address);

      expect(assets1).to.be.lt(assets2);
    });
  });

  describe("Agent Actions", function () {
    beforeEach(async function () {
      await mockUSDC.connect(user1).approve(await vault.getAddress(), THOUSAND_USDC);
      await vault.connect(user1).deposit(THOUSAND_USDC, user1.address);
    });

    it("Should allow agent to deploy to Aave", async function () {
      const deployAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await vault.connect(agentWallet).agentDeployToAave(
        deployAmount,
        "Deploying 50% to Aave. Current APY: 4.2%. Risk level: LOW. Market stable."
      );

      expect(await vault.totalAaveDeposited()).to.equal(deployAmount);
      expect(await vault.totalAgentExecutions()).to.equal(1);
    });

    it("Should reject unregistered agent", async function () {
      await expect(
        vault.connect(user2).agentDeployToAave(
          ONE_USDC,
          "Unauthorized agent attempt"
        )
      ).to.be.revertedWithCustomError(vault, "OnlyRegisteredAgent");
    });

    it("Should reject agent exceeding max tx value", async function () {
      const tooMuch = ethers.parseUnits("50001", USDC_DECIMALS);
      await mockUSDC.mint(await vault.getAddress(), tooMuch);
      await expect(
        vault.connect(agentWallet).agentDeployToAave(tooMuch, "Too much")
      ).to.be.revertedWithCustomError(agentRegistry, "ExceedsMaxTxValue");
    });

    it("Should allow agent to withdraw from Aave", async function () {
      const deployAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await vault.connect(agentWallet).agentDeployToAave(deployAmount, "Deploy");

      await vault.connect(agentWallet).agentWithdrawFromAave(
        deployAmount,
        "Withdrawing from Aave. ETH volatility spike detected. Moving to safety."
      );

      expect(await vault.totalAaveDeposited()).to.equal(0);
    });

    it("Should log all agent actions in registry", async function () {
      await vault.connect(agentWallet).agentDeployToAave(
        ethers.parseUnits("100", USDC_DECIMALS),
        "Test reasoning"
      );

      const logs = await agentRegistry.getAgentLogs(agentWallet.address);
      expect(logs.length).to.equal(1);
      expect(logs[0].reasoning).to.equal("Test reasoning");
    });
  });

  describe("Emergency Exit", function () {
    it("Should allow sentinel to trigger emergency exit", async function () {
      const deployAmount = ethers.parseUnits("500", USDC_DECIMALS);
      await mockUSDC.connect(user1).approve(await vault.getAddress(), THOUSAND_USDC);
      await vault.connect(user1).deposit(THOUSAND_USDC, user1.address);
      await vault.connect(agentWallet).agentDeployToAave(deployAmount, "Deploy");

      await vault.connect(deployer).agentEmergencyExit(
        "CRITICAL: ETH dropped 25% in 1 hour. Sentinel triggered emergency exit."
      );

      expect(await vault.emergencyMode()).to.equal(true);
    });

    it("Should reject emergency exit from non-sentinel agent", async function () {
      await expect(
        vault.connect(agentWallet).agentEmergencyExit("Unauthorized")
      ).to.be.revertedWithCustomError(vault, "NotAuthorizedForEmergencyExit");
    });
  });

  describe("Strategy", function () {
    it("Should apply template strategies", async function () {
      await strategy.connect(user1).applyTemplate(0); // Stable Income
      const s = await strategy.getStrategy(user1.address);
      expect(s.riskLevel).to.equal(1);
      expect(s.aaveAllocation).to.equal(7000);
      expect(s.isActive).to.equal(true);
    });

    it("Should set custom strategy", async function () {
      await strategy.connect(user1).setStrategy(
        "Custom: 60% Aave, 30% stable, 10% ETH",
        2, 6000, 3000, 1000, true, 500, true, 2000
      );
      const s = await strategy.getStrategy(user1.address);
      expect(s.aaveAllocation).to.equal(6000);
    });

    it("Should reject invalid allocations", async function () {
      await expect(
        strategy.connect(user1).setStrategy(
          "Invalid", 2, 6000, 3000, 2000, // sums to 11000, not 10000
          true, 500, true, 2000
        )
      ).to.be.revertedWithCustomError(strategy, "AllocationsMustSum10000");
    });
  });

  describe("Vault Metrics", function () {
    it("Should report correct TVL", async function () {
      await mockUSDC.connect(user1).approve(await vault.getAddress(), THOUSAND_USDC);
      await vault.connect(user1).deposit(THOUSAND_USDC, user1.address);

      const [tvl] = await vault.getVaultMetrics();
      expect(tvl).to.equal(THOUSAND_USDC);
    });
  });
});