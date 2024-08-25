const express = require("express");
const contractRouter = require ("./routes/contract.routes.js")
const app = express();
const cors = require('cors')
const bodyParser = require ('body-parser')
const port = 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 

app.use('/api/v1/contract', contractRouter)

app.listen(port, () => {
  console.log(`Example app listening on  http://localhost:${port}`);
});
