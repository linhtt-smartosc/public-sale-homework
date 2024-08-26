const { expect } = require("chai");
const exp = require("constants");
const { ethers } = require("hardhat");

const SALE_TOKEN_NAME = "SaleToken";
const SALE_TOKEN_SYMBOL = "ST";
describe("Sale Token Factory", function () {
  describe("Create Sale Token", async function () {
    let owner;
    let saleTokenFactory;
    let saleTokenFactoryDeployed;
    it("Should create sale token", async function () {
      const [owner] = await ethers.getSigners();

      saleTokenFactory = await ethers.getContractFactory("SaleTokenFactory");

      saleTokenFactoryDeployed = await saleTokenFactory.connect(owner).deploy();

      await expect(await saleTokenFactoryDeployed.connect(owner).createSaleToken(SALE_TOKEN_NAME, SALE_TOKEN_SYMBOL))
        .to.emit(saleTokenFactoryDeployed, "ERC20TokenCreated")
        .withArgs(await saleTokenFactoryDeployed.tokens(0));

      let saleTokenList = await saleTokenFactoryDeployed.connect(owner).getSaleTokens();
      expect(saleTokenList.length == 1).to.equal(true, "Sale Token Contract wasn't created")
    });
  });
});
