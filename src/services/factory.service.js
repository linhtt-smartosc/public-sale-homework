const { publicSaleFactory, erc20Factory } = require('../config/contract-intances');
const getEvent = require('../utils/getEvent.util');

async function createSaleToken(name, symbol) {
    const transaction = await erc20Factory.createSaleToken(name, symbol);
    const receipt = await transaction.wait();
    let saleTokenAddress;
    const event = await getEvent(erc20Factory, 'ERC20TokenCreated', receipt);
    if (event.length > 0) {
        saleTokenAddress = event[0].args[0];
    }
    return saleTokenAddress;
}

async function createPublicSale(s_token_address, b_token_address, b_token_decimals, s_token_decimals, max_spend_per_buyer, token_rate, hardcap, softcap, duration) {
    const transaction = await publicSaleFactory.createPublicSale(s_token_address, b_token_address, b_token_decimals, s_token_decimals, max_spend_per_buyer, token_rate, hardcap, softcap, duration);
    const receipt = await transaction.wait();
    let saleAddress;
    const event = await getEvent(publicSaleFactory, 'PublicSaleCreated', receipt);
    if (event.length > 0) {
        saleAddress = event[0].args[0];
    }
    return saleAddress;
}

module.exports = {
    createSaleToken,
    createPublicSale
}