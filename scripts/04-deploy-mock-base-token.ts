import { ethers } from "hardhat";
import { writeAddresses } from "../utils/addressManager";
import {Task} from "../utils/addressManager"
import 'dotenv/config'

const BASE_TOKEN_NAME = "BaseToken";
const BASE_TOKEN_SYMBOL = "BT";
async function main() {
  //NOTE: Deployment of Base Token
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");

  const baseToken = await ERC20Mock.deploy(BASE_TOKEN_NAME, BASE_TOKEN_SYMBOL);
  await baseToken.waitForDeployment()
  console.log(await baseToken.getAddress())
  const chainID = Number((await ethers.provider.getNetwork()).chainId)

  writeAddresses(Task.deploy_base_token, chainID, {
    DEPLOYED_BASE_TOKEN_ADDRESS: await baseToken.getAddress(),
  })
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
