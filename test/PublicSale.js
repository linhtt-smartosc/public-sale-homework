const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const MockERC20_ABI = require("../artifacts/contracts/ERC20Mock.sol/ERC20Mock.json").abi;
const PublicSale_ABI = require("../artifacts/contracts/PublicSale.sol/PublicSale.json").abi;


describe("PublicSale", function () {
  let PublicSale, publicSale, owner, addr1, addr2;
  let saleToken, baseToken;
  const maxSpend = ethers.parseUnits("10", 18);
  const amount = ethers.parseUnits("1000", 18);
  const hardCap = ethers.parseUnits("100", 18);
  const softCap = ethers.parseUnits("10", 18);
  const rate = 10;
  const duration = 60 * 60 * 24 * 7; // 7 days

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MockERC20 = new ethers.ContractFactory(MockERC20_ABI, owner);
    const PublicSale = new ethers.ContractFactory(PublicSale_ABI, owner);
    
    saleToken = await MockERC20.deploy("SaleToken", "ST");
    console.log("Sale Token: ", saleToken.address);
    
    baseToken = await MockERC20.deploy("BaseToken", "BT");

    PublicSale = await ethers.getContractFactory("PublicSale");
    publicSale = await PublicSale.deploy(
      saleToken.address,
      baseToken.address,
      rate,
      maxSpend,
      hardCap,
      softCap,
      duration
    );

    // await baseToken.mint(addr1.address, ethers.utils.parseUnits("50", 18));
    // await baseToken.mint(addr2.address, ethers.utils.parseUnits("50", 18));
    // await baseToken.connect(addr1).approve(publicSale.address, ethers.utils.parseUnits("50", 18));
    // await baseToken.connect(addr2).approve(publicSale.address, ethers.utils.parseUnits("50", 18));

    // await saleToken.mint(publicSale.address, amount);
    // await saleToken.connect(owner).approve(publicSale.address, amount);

  });

  describe("Deployment", function () {
    
    it("Should initialize the contract", async function () {
      await saleToken.deployed();
      await baseToken.deployed();
      console.log("Sale Token: ", saleToken.address);

      expect(await publicSale.saleToken()).to.equal(saleToken.address);
      expect(await publicSale.baseToken()).to.equal(baseToken.address);
      expect(await publicSale.rate()).to.equal(rate);
      expect(await publicSale.maxSpend()).to.equal(maxSpend);
      expect(await publicSale.hardCap()).to.equal(hardCap);
      expect(await publicSale.softCap()).to.equal(softCap);
      expect(await publicSale.duration()).to.equal(duration);
    });
  });

  // it("Should be able to deposit", async function () {
  //   await publicSale.connect(owner).deposit(amount);
  //   expect(await saleToken.balanceOf(publicSale.address)).to.equal(amount);
  // });
});