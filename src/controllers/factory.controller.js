const { ethers } = require('ethers');
const factoryService = require('../services/factory.service');

async function createPublicSale(req, res) {
    const { s_token_address, b_token_address, b_token_decimals, s_token_decimals, max_spend_per_buyer, token_rate, hardcap,  softcap, duration } = req.body;
    const MAX_SPEND_PER_BUYER = BigInt(max_spend_per_buyer);
    const HARD_CAP = BigInt(hardcap);
    const SOFT_CAP = BigInt(softcap);
    const result = await factoryService.createPublicSale(s_token_address, b_token_address, b_token_decimals, s_token_decimals, MAX_SPEND_PER_BUYER, token_rate, HARD_CAP, SOFT_CAP, duration);
    return res.status(200).send(result);
}

async function createSaleToken(req, res) {
    const { name, symbol } = req.body;
    const result = await factoryService.createSaleToken(name, symbol);
    return res.status(200).send(result);
}

module.exports = {
    createPublicSale,
    createSaleToken
}