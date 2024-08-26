const express = require("express");
const { publicSaleRouter, factoryRouter } = require('./routes/index')

const app = express();
const cors = require('cors')
const bodyParser = require('body-parser')
const port = process.env.PORT || 8000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api/v1/contract', publicSaleRouter);
app.use('/api/v1/factory', factoryRouter);

app.listen(port, () => {
  console.log(`Example app listening on  http://localhost:${port}`);
});
