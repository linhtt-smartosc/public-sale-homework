const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PublicSale Contract", function () {
  let PublicSale, publicSale, owner, addr1, addr2;
  let saleToken, baseToken;
  const tokenPrice = ethers.parseUnits("1", 18); // Token price in wei
  const maxSpend = ethers.parseUnits("10", 18); // Max spend per buyer in base token
  const amount = ethers.parseUnits("1000", 18); // Amount of presale tokens
  const hardCap = ethers.parseUnits("100", 18); // Hard cap in base token
  const softCap = ethers.parseUnits("10", 18); // Soft cap in base token
  const startBlock = 1;
  const endBlock = 10;
  const lockPeriod = 2 * 7 * 24 * 60 * 60; // 2 weeks in seconds

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy ERC20 tokens
    const ERC20 = await ethers.getContractFactory("ERC20Mock");
    saleToken = await ERC20.deploy("SaleToken", "STK");
    baseToken = await ERC20.deploy("BaseToken", "BTK");

    // Deploy PublicSale contract
    PublicSale = await ethers.getContractFactory("PublicSale");
    publicSale = await PublicSale.deploy();
    await publicSale.Initialize(
      owner.address,
      saleToken.address,
      baseToken.address,
      tokenPrice,
      maxSpend,
      amount,
      hardCap,
      softCap,
      startBlock,
      endBlock,
      lockPeriod
    );

    // Mint and approve tokens
    await baseToken.mint(addr1.address, ethers.utils.parseUnits("50", 18));
    await baseToken
      .connect(addr1)
      .approve(publicSale.address, ethers.utils.parseUnits("50", 18));
  });

  describe("Initialization", function () {
    it("Should initialize correctly", async function () {
      const publicSaleInfo = await publicSale.PUBLICSALE_INFO();
      expect(publicSaleInfo.PRESALE_OWNER).to.equal(owner.address);
      expect(publicSaleInfo.S_TOKEN).to.equal(saleToken.address);
      expect(publicSaleInfo.B_TOKEN).to.equal(baseToken.address);
      expect(publicSaleInfo.TOKEN_PRICE.toString()).to.equal(
        tokenPrice.toString()
      );
    });
  });

  describe("Deposit", function () {
    it("Should allow owner to deposit tokens", async function () {
      await saleToken.mint(owner.address, ethers.utils.parseUnits("1000", 18));
      await saleToken
        .connect(owner)
        .approve(publicSale.address, ethers.utils.parseUnits("1000", 18));
      await publicSale
        .connect(owner)
        .deposit(ethers.utils.parseUnits("500", 18));

      expect(await saleToken.balanceOf(publicSale.address)).to.equal(
        ethers.utils.parseUnits("500", 18)
      );
    });

    it("Should fail if non-owner tries to deposit tokens", async function () {
      await expect(
        publicSale.connect(addr1).deposit(ethers.utils.parseUnits("500", 18))
      ).to.be.revertedWith("Unauthorized");
    });
  });

  describe("Purchase", function () {
    it("Should allow users to purchase tokens", async function () {
      await publicSale
        .connect(owner)
        .deposit(ethers.utils.parseUnits("500", 18));

      await publicSale
        .connect(addr1)
        .purchase(ethers.utils.parseUnits("5", 18));

      const buyerInfo = await publicSale.BUYERS(addr1.address);
      expect(buyerInfo.baseDeposited.toString()).to.equal(
        ethers.utils.parseUnits("5", 18).toString()
      );
      // Token amount calculation: 5 base token * 10^18 / tokenPrice
      const tokens = ethers.utils
        .parseUnits("5", 18)
        .mul(ethers.constants.WeiPerEther)
        .div(tokenPrice);
      expect(buyerInfo.tokensOwed.toString()).to.equal(tokens.toString());
    });
  });

  describe("Finalize", function () {
    it("Should finalize the sale as succeeded", async function () {
      await publicSale
        .connect(owner)
        .deposit(ethers.utils.parseUnits("500", 18));
      await ethers.provider.send("evm_mine", [endBlock + 1]);

      await publicSale.connect(owner).finalize();
      const state = await publicSale.STATE();
      expect(state).to.equal(2); // SUCCEEDED state
    });
  });

  describe("Refund", function () {
    it("Should allow refund if sale fails", async function () {
      await publicSale
        .connect(owner)
        .deposit(ethers.utils.parseUnits("500", 18));
      await publicSale.connect(owner).cancel();

      const balanceBefore = await baseToken.balanceOf(addr1.address);
      await publicSale.connect(addr1).refund();
      const balanceAfter = await baseToken.balanceOf(addr1.address);

      expect(balanceAfter.sub(balanceBefore)).to.equal(
        ethers.utils.parseUnits("5", 18)
      );
    });
  });

  describe("Lock", function () {
    it("Should lock tokens if sale is successful", async function () {
      await publicSale
        .connect(owner)
        .deposit(ethers.utils.parseUnits("500", 18));
      await publicSale
        .connect(addr1)
        .purchase(ethers.utils.parseUnits("5", 18));
      await ethers.provider.send("evm_mine", [endBlock + 1]);
      await publicSale.connect(owner).finalize();

      const balanceBefore = await saleToken.balanceOf(
        PUBLICSALE_INFO.PRESALE_OWNER
      );
      await publicSale.connect(owner).lock();
      const balanceAfter = await saleToken.balanceOf(
        PUBLICSALE_INFO.PRESALE_OWNER
      );

      expect(balanceAfter.sub(balanceBefore)).to.equal(
        ethers.utils.parseUnits("5", 18)
      );
    });
  });
});
