const express = require ('express')
const publicsale_router  = express.Router();

const contractController = require ('../controllers/contract.controller')

publicsale_router.post('/deposit', contractController.deposit);
publicsale_router.post('/purchase', contractController.purchase);
publicsale_router.post('/claim', contractController.claim);
publicsale_router.post('/cancel', contractController.cancel);
publicsale_router.post('/refund', contractController.refund);

module.exports = publicsale_router;