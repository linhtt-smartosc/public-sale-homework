const fs = require("fs");
const path = require("path");

const writeAddresses = async (
  chainId: number,
  addresses: any
): Promise<void> => {
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

const getFilePath = (networkName: string): string => {
  return path.join(__dirname, `../addresses-${networkName}.json`);
};

const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return "ethereum";
    case 11155111:
      return "sepolia";
    case 1337:
      return "localhost";
  }
  return "";
};

const getAddresses = async (chainId: number): Promise<any> => {
  const networkName = getNetworkName(chainId);
  return new Promise((resolve, reject) => {
    fs.readFile(getFilePath(networkName), (err: any, data: { toString: () => string; }) => {
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