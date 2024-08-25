const contractService = require ('../services/contract.services')

async function deposit(req, res) {
    const [ address, amount, privateKey ] = req.body;  
    const result = contractService.deposit(address, amount, privateKey)
    return result;
};

async function purchase(req, res) {

};

async function refund(req, res) {

};

async function claim(req, res) {

};

async function cancel(req, res) {

};

module.exports = {
    deposit,
    refund,
    cancel,
    claim,
    purchase
}

