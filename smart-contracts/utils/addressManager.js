const fs = require("fs");
const path = require("path");

const writeAddresses = async (
  chainId,
  addresses
) => {
  const prevAddresses = await getAddresses(chainId);
  const newAddresses = {
    ...prevAddresses,
    ...addresses,
  };

  return new Promise((resolve, _reject) => {
    fs.writeFile(
      getFilePath(getNetworkName(chainId)),
      JSON.stringify(newAddresses),
      () => {
        resolve();
      }
    );
  });
};

const getFilePath = (networkName) => {
  return path.join(__dirname, `../addresses-${networkName}.json`);
};

const getNetworkName = (chainId) => {
  switch (chainId) {
    case 1:
      return "ethereum";
    case 11155111:
      return "sepolia";
    case 31337:
      return "localhost";
    case 1337:
      return "hardhat"
  }
  return "";
};

const getAddresses = async (chainId) => {
  const networkName = getNetworkName(chainId);
  return new Promise((resolve, reject) => {
    fs.readFile(getFilePath(networkName), (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data.toString()));
      }
    });
  });
};

module.exports = {
  writeAddresses,
  getAddresses,
};