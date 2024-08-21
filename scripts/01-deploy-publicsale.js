import pkg from "hardhat";
const { ethers } = pkg;


async function main() {
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");

  const baseToken = await ERC20Mock.deploy("Base Token", "BTK");
  await baseToken.waitForDeployment();
  const baseTokenAddress = await baseToken.getAddress();

  console.log(`BTK tokens minted to ${baseTokenAddress}`);

  const saleToken = await ERC20Mock.deploy("Sale Token", "STK");
  await saleToken.waitForDeployment();
  const saleTokenAddress = await saleToken.getAddress();
  console.log(`STK tokens minted to ${saleTokenAddress}`);

  const sTokenDecimals = 18;
  const bTokenDecimals = 18;
  const maxSpendPerBuyer = BigInt(10 * 10 ** bTokenDecimals); // 10 base token
  const tokenRate = 1000; // 1 base token = 1000 sale tokens
  const hardcap = BigInt(100 * 10 ** bTokenDecimals);
  const softcap = BigInt(30 * 10 ** bTokenDecimals);
  const duration = 60 * 60 * 24 * 7; // 7 days

  // deploys PublicSale
  const PublicSale = await ethers.getContractFactory("PublicSaleFactory");
  const publicSale = await PublicSale.deploy(
  );

  await publicSale.waitForDeployment();
  console.log("PublicSale deployed to:", await publicSale.getAddress());
}

main();

//npx hardhat run scripts/01-deploy-publicsale.js --network bsctest
//npx hardhat verify --network bsctest 0xa7073a62d49fD6d7C3F46aFfA3b284EE91E886Ac "0xdbD9914D07F8930dE2EA436cE70C882A9B37Cd68" "0xAaa1a48168e720631cDC01F3de1b23de2e8c4F3E" 18 18 10000000000000000000 1000 100000000000000000000 30000000000000000000 60480
