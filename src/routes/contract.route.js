const express = require ('express')
const publicSaleRouter  = express.Router();

const contractController = require ('../controllers/contract.controller')

publicSaleRouter.post('/deposit', contractController.deposit);
publicSaleRouter.post('/purchase', contractController.purchase);
publicSaleRouter.post('/claim', contractController.claim);
publicSaleRouter.post('/cancel', contractController.cancel);
publicSaleRouter.post('/refund', contractController.refund);

module.exports = publicSaleRouter;