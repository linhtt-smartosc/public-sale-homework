const { writeAddresses } = require("../utils/addressManager");
const { ethers } = require("hardhat");
require("dotenv").config();

const SALE_TOKEN_DECIMALS = 18;
const BASE_TOKEN_DECIMALS = 18;
const MAX_SPEND_PER_BUYER = BigInt(20 * 10 ** BASE_TOKEN_DECIMALS); // 20 sale tokens
const TOKEN_RATE = 3;
const HARD_CAP = BigInt(50 * 10 ** BASE_TOKEN_DECIMALS); // 1000 sale tokens
const SOFT_CAP = BigInt(30 * 10 ** BASE_TOKEN_DECIMALS); // 100 sale tokens
const DURATION = 604800; // 1 week
const BASE_TOKEN_NAME = "BaseToken";
const BASE_TOKEN_SYMBOL = "BT";
const SALE_TOKEN_NAME = "SaleToken";
const SALE_TOKEN_SYMBOL = "ST";
// const BASE_TOKEN_MINT_AMOUNT = 1000;
// const SALE_TOKEN_MINT_AMOUNT = 10000;

async function main() {
  const signer = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    ethers.provider
  );
  //NOTE: Deployment of Base Token
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");

  const baseToken = await ERC20Mock.deploy(BASE_TOKEN_NAME, BASE_TOKEN_SYMBOL);
  await baseToken.waitForDeployment();

  //NOTE: Deployment of Sale Token Factory
  const saleTokenFactory = await ethers.getContractFactory("SaleTokenFactory");
  const saleTokenFactoryDeployed = await saleTokenFactory.deploy();
  await saleTokenFactoryDeployed.waitForDeployment();

  //NOTE: Deployment of Sale Token
  const saleTokenResponse = await saleTokenFactoryDeployed.createSaleToken(
    SALE_TOKEN_NAME,
    SALE_TOKEN_SYMBOL
  );
  await saleTokenResponse.wait(1);

  // await saleTokenFactoryDeployed.deploymentTransaction()!.wait(2)
  const saleTokenList = await saleTokenFactoryDeployed.getSaleTokens();
  const saleTokenAddress = saleTokenList[saleTokenList.length - 1];
  const saleToken = await ethers.getContractAt(
    "SaleToken",
    saleTokenAddress,
    signer
  );
  await saleToken.waitForDeployment();

  //NOTE: Deployment of Public Sale Factory
  const publicSaleContractFactory = await ethers.getContractFactory(
    "PublicSaleFactory"
  );
  const publicSaleContractFactoryDeployed =
    await publicSaleContractFactory.deploy();
  publicSaleContractFactoryDeployed.waitForDeployment();

  //NOTE: Deployment of Public Sale
  const publicSaleResponse =
    await publicSaleContractFactoryDeployed.createPublicSale(
      await saleToken.getAddress(),
      await baseToken.getAddress(),
      BASE_TOKEN_DECIMALS,
      SALE_TOKEN_DECIMALS,
      MAX_SPEND_PER_BUYER,
      TOKEN_RATE,
      HARD_CAP,
      SOFT_CAP,
      DURATION
    );
  await publicSaleResponse.wait(1);
  // await publicSaleContractFactoryDeployed.deploymentTransaction()?.wait(2);
  const publicSaleList =
    await publicSaleContractFactoryDeployed.getPublicSales();
  const publicSaleAddress = publicSaleList[publicSaleList.length - 1];
  const publicSale = await ethers.getContractAt(
    "PublicSale",
    publicSaleAddress,
    signer
  );

  await publicSale.waitForDeployment();

  const chainID = Number((await ethers.provider.getNetwork()).chainId);

  writeAddresses(chainID, {
    DEPLOYED_SALE_TOKEN_FACTORY_ADDRESS:
      await saleTokenFactoryDeployed.getAddress(),
    DEPLOYED_PUBLIC_SALE_FACTORY_ADDRESS:
      await publicSaleContractFactoryDeployed.getAddress(),

    DEPLOYED_BASE_TOKEN_ADDRESS: await baseToken.getAddress(),
    DEPLOYED_SALE_TOKEN_ADDRESS: await saleToken.getAddress(),
    DEPLOYED_PUBLIC_SALE_ADDRESS: await publicSale.getAddress(),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
