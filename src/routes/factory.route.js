const express = require('express')
const factory_router = express.Router();

const factoryController = require('../controllers/factory.controller')

factory_router.post('/publicsale/create', factoryController.createPublicSale);
factory_router.post('/saletoken/create', factoryController.createSaleToken);

module.exports = factory_router;