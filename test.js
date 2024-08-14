const  { BigNumber } = require ("@ethersproject/bignumber");
const  { parseUnits } = require( "@ethersproject/units");

const amount_to_deposit = BigInt(100 * 10 ** 18);
console.log((amount_to_deposit.toString ()))

const b = parseUnits('1', 18) // Creates BigNumber of 1000000000000000000
console.log(b.toString()) // 1000000000000000000;