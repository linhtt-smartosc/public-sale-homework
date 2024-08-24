const { ethers } = require("hardhat");

async function main() {
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");

  const baseToken = await ERC20Mock.deploy("Base Token", "BTK");
  await baseToken.waitForDeployment();
 
  const saleToken = await ERC20Mock.deploy("Sale Token", "STK");
  await saleToken.waitForDeployment();
  

  const PublicSale = await ethers.getContractFactory("PublicSaleFactory");
  const publicSale = await PublicSale.deploy();

  await publicSale  console.log("PublicSaleFactory deployed to:", await publicSale.getAddress());
.waitForDeployment();
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
});

//npx hardhat verify --network bsctest (contract address)
