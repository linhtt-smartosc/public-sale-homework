import { ethers } from "hardhat";
import { writeAddresses } from "../utils/addressManager";
import 'dotenv/config'

async function main() {

  //NOTE: Deployment of Sale Token Factory
  const saleTokenFactory = await ethers.getContractFactory("SaleTokenFactory");
  const saleTokenFactoryDeployed = await saleTokenFactory.deploy();
  await saleTokenFactoryDeployed.waitForDeployment();


  //NOTE: Deployment of Public Sale Factory  
  const publicSaleContractFactory = await ethers.getContractFactory("PublicSaleFactory");
  const publicSaleContractFactoryDeployed = await publicSaleContractFactory.deploy();
  publicSaleContractFactoryDeployed.waitForDeployment();

  const chainID = Number((await ethers.provider.getNetwork()).chainId)

  writeAddresses(chainID, {
    DEPLOYED_SALE_TOKEN_FACTORY_ADDRESS: await saleTokenFactoryDeployed.getAddress(),
    DEPLOYED_PUBLIC_SALE_FACTORY_ADDRESS: await publicSaleContractFactoryDeployed.getAddress(),
  })
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
