const { ethers } = require("hardhat");
const { writeAddresses } = require("../utils/addressManager");
require ('dotenv').config();

async function main() { 
  const saleTokenFactory = await ethers.getContractFactory("SaleTokenFactory");
  const saleTokenFactoryDeployed = await saleTokenFactory.deploy();
  await saleTokenFactoryDeployed.waitForDeployment();

  const publicSaleContractFactory = await ethers.getContractFactory("PublicSaleFactory");
  const publicSaleContractFactoryDeployed = await publicSaleContractFactory.deploy();
  publicSaleContractFactoryDeployed.waitForDeployment();

  const chainID = Number((await ethers.provider.getNetwork()).chainId)

  console.log("Sale Token Factory deployed info:", saleTokenFactoryDeployed);
  console.log("Public Sale Factory deployed info:", publicSaleContractFactoryDeployed);
  

  writeAddresses(chainID, {
    DEPLOYED_SALE_TOKEN_FACTORY_ADDRESS: await saleTokenFactoryDeployed.getAddress(),
    DEPLOYED_PUBLIC_SALE_FACTORY_ADDRESS: await publicSaleContractFactoryDeployed.getAddress()
  })
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
