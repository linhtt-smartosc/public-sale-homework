const express = require('express');
const factoryRouter = express.Router();

const factoryController = require('../controllers/factory.controller');

factoryRouter.post('/publicsale/create', factoryController.createPublicSale);
factoryRouter.post('/erc20token/create', factoryController.createSaleToken);

module.exports = factoryRouter;