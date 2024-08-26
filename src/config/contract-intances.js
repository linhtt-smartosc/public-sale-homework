const { ethers, JsonRpcProvider } = require('ethers');
const publicSaleFactoryContract = require('../../smart-contracts/artifacts/contracts/PublicSaleFactory.sol/PublicSaleFactory.json');
const erc20FactoryContract = require('../../smart-contracts/artifacts/contracts/SaleTokenFactory.sol/SaleTokenFactory.json');

const network = process.env.PROVIDER_URL;
const provider = new JsonRpcProvider(network);
const signer = new ethers.Wallet(process.env.LOCAL_PRIVATE_KEY, provider);
const publicSaleFactory = new ethers.Contract(process.env.DEPLOYED_PUBLIC_SALE_FACTORY_ADDRESS, publicSaleFactoryContract.abi, signer);
const erc20Factory = new ethers.Contract(process.env.DEPLOYED_SALE_TOKEN_FACTORY_ADDRESS, erc20FactoryContract.abi, signer);

module.exports = {
    publicSaleFactory,
    erc20Factory,
    provider,
    signer
}
