const dns = require("dns");
dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
  "0.0.0.0",
  "1.1.1.1",
  "103.129.238.255",
  "192.168.1.1",
]);
const express = require("express");
//Database connection
const { connectdb } = require("./db/dbconfig");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
