const express = require ('express')
const router  = express.Router();

const contractController = require ('../controllers/contract.controllers')

router.post('/deposit', contractController.deposit);
router.post('/purchase', contractController.purchase);
router.post('/claim', contractController.claim);
router.post('/cancel', contractController.cancel);
router.post('/refund', contractController.refund);

module.exports = router;