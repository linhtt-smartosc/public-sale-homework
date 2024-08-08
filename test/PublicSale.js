const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('PublicSale', function () {  

  async function deployContractAndSetVariables() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory('ERC20Mock');
    
    const base_token = await MockERC20.connect(owner).deploy(
      'BaseToken',
      'BT',
    );
    console.log('Base Token Address: ', base_token.address);
    
    const sale_token = await MockERC20.deploy(
      'SaleToken',
      'ST',
    );

    const PublicSale = await ethers.getContractFactory('PublicSale');
    const publicsale = await PublicSale.deploy(
      '0x2B685c26604E3b95dbAE3deabDE2c83AEFC73C51',  // _s_token_address
      '0x7D4cbb8B55Ba156D5BBC7C3eBf04c805e9375BAA',  // _b_token_address
      18,                  // _b_token_decimals
      18,                  // _s_token_decimals
      20,                  // _max_spend_per_buyer
      3,                   // _token_rate
      100,                 // _hardcap
      10,                  // _softcap
      604800               // _duration
    );

    return { publicsale, owner, addr1, addr2, addr3 };
  }

  it('Should deploy contract and set the owner correctly', async function () {
    const { publicsale, owner } = await deployContractAndSetVariables();
    expect(await publicsale.owner()).to.equal(owner.address);
  }); 
})