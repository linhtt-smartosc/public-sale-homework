const helpers = require('@nomicfoundation/hardhat-network-helpers');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const ErrorContractArtifact = require("../artifacts/contracts/interfaces/Error.sol/Error.json");

describe('PublicSale', function () {

  async function deployContractAndSetVariables() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory('ERC20Mock');

    const base_token = await MockERC20.connect(owner).deploy(
      'BaseToken',
      'BT',
    );

    base_token.connect(addr1).mint(addr1.getAddress(), 1000);
    base_token.connect(addr2).mint(addr2.getAddress(), 1000);
    base_token.connect(addr3).mint(addr3.getAddress(), 1000);

    const sale_token = await MockERC20.deploy(
      'SaleToken',
      'ST',
    );

    sale_token.connect(owner).mint(owner.getAddress(), 10000);
    sale_token.connect(addr1).mint(addr1.getAddress(), 1000);

    const PublicSale = await ethers.getContractFactory('PublicSale');
    const publicsale = await PublicSale.deploy(
      sale_token.getAddress(),  // _s_token_address
      base_token.getAddress(),  // _b_token_address
      18,                  // _b_token_decimals
      18,                  // _s_token_decimals
      20,                  // _max_spend_per_buyer
      3,                   // _token_rate
      100,                 // _hardcap
      10,                  // _softcap
      604800               // _duration
    );

    return { publicsale, owner, addr1, addr2, addr3, base_token, sale_token };
  }


  async function deployContractAndSetVariablesV2() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory('ERC20Mock');

    const base_token = await MockERC20.connect(owner).deploy(
      'BaseToken',
      'BT',
    );

    base_token.connect(addr1).mint(addr1.getAddress(), 1000);
    base_token.connect(addr2).mint(addr2.getAddress(), 1000);
    base_token.connect(addr3).mint(addr3.getAddress(), 1000);

    const sale_token = await MockERC20.deploy(
      'SaleToken',
      'ST',
    );

    sale_token.connect(owner).mint(owner.getAddress(), 10000);
    sale_token.connect(addr1).mint(addr1.getAddress(), 1000);

    const PublicSale = await ethers.getContractFactory('PublicSale');
    const publicsale = await PublicSale.deploy(
      sale_token.getAddress(),  // _s_token_address
      base_token.getAddress(),  // _b_token_address
      18,                  // _b_token_decimals
      18,                  // _s_token_decimals
      50,                  // _max_spend_per_buyer
      3,                   // _token_rate
      100,                 // _hardcap
      10,                  // _softcap
      604800               // _duration
    );

    return { publicsale, owner, addr1, addr2, addr3, base_token, sale_token };
  }

  it('Should deploy contract and set the owner correctly', async function () {
    const { publicsale, owner } = await loadFixture(deployContractAndSetVariables);
    expect(await publicsale.owner()).to.equal(owner.address);
  });

  describe('Deposit tokens', function () {
    it('Should be able to deposit sale tokens to contract' , async function () {
      const { publicsale, owner, sale_token } = await loadFixture(deployContractAndSetVariables);
      await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(owner).deposit(10000);

      const publicsaleInfo = await publicsale.publicsale_info();
      const time_of_latest_block = BigInt(await time.latest());

      expect(publicsaleInfo[7]).to.equal(10000);
      expect(publicsaleInfo[10]).to.equal(time_of_latest_block);
      expect(publicsaleInfo[11]).to.equal(time_of_latest_block + publicsaleInfo[12]);
    });

    describe('Cannot deposit tokens', function () {
      it('Should not be able to deposit sale tokens when not owner and not in correct time', async function () {
        const { publicsale, addr1, sale_token, owner } = await loadFixture(deployContractAndSetVariables);

        await sale_token.connect(addr1).approve(publicsale.getAddress(), 1000);
        await sale_token.connect(owner).approve(publicsale.getAddress(), 2000);

        // not owner
        await expect(publicsale.connect(addr1).deposit(1000)).to.be.revertedWithCustomError(
          publicsale,
          "OwnableUnauthorizedAccount"
        ).withArgs(await addr1.getAddress());

        // not allow after start time
        await time.increase(604800);
        try {
          expect(publicsale.connect(owner).deposit(1000)).to.be.revertedWith("Deposit not allowed");
        } catch (error) {
          console.log(error);
        }
      })
      it('Should not be able to deposit sale tokens after deposit', async function () {
        const { publicsale, owner, sale_token } = await loadFixture(deployContractAndSetVariables);
        await sale_token.connect(owner).approve(publicsale.getAddress(), 2000);
        await publicsale.connect(owner).deposit(1000);
        try {
          expect(publicsale.connect(owner).deposit(1000)).to.be.revertedWith("Deposit not allowed");
        } catch (error) {
          console.log(error);
        }
      })
    });
  })

  describe('Purchase tokens', function () {

    it('Should purchase tokens', async function () {
      const { publicsale, owner, addr1, addr2, addr3 } = await loadFixture(deployContractAndSetVariables);
      
    });
  })
  describe('Claim tokens', function () {
    it ("Should be claimable by equalling hard cap", async function () {
      const { publicsale, owner, addr1, addr2, addr3, base_token, sale_token} = await loadFixture(deployContractAndSetVariablesV2);

      //=========================================================//
      await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(owner).deposit(10000);
      //=========================================================//

      //=========================================================//
      await base_token.connect(addr1).approve(publicsale.getAddress(),100);
      await base_token.connect(addr2).approve(publicsale.getAddress(),100);
      await base_token.connect(addr3).approve(publicsale.getAddress(),100);

      await publicsale.connect(addr1).purchase(20n);
      await publicsale.connect(addr1).purchase(20n);
      await publicsale.connect(addr2).purchase(20n);
      await publicsale.connect(addr2).purchase(20n);
      await publicsale.connect(addr3).purchase(20n);
      //=========================================================//
      const  publicsaleInfo = await publicsale.publicsale_info();
      const  publicsaleStatus = await publicsale.publicsale_status();
      const TOTAL_BASE_COLLECTED = publicsaleStatus.TOTAL_BASE_COLLECTED;
      const HARD_CAP = publicsaleInfo.HARDCAP;
      //=========================================================//

      expect(TOTAL_BASE_COLLECTED >= HARD_CAP).to.equal(true, "Claim not allowed")
      expect(publicsale.connect(addr1).claim())

    })
    it ("Should be claimable by endtime and soft_cap exceed", async function () {
      const { publicsale, owner, addr1, addr2, addr3, base_token, sale_token} = await loadFixture(deployContractAndSetVariablesV2);

      //=========================================================//
      await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(owner).deposit(10000);
      //=========================================================//

      //=========================================================//
      await base_token.connect(addr1).approve(publicsale.getAddress(),100);
      await base_token.connect(addr2).approve(publicsale.getAddress(),100);
      await base_token.connect(addr3).approve(publicsale.getAddress(),100);

      await publicsale.connect(addr1).purchase(20n);
      await publicsale.connect(addr1).purchase(20n);
      await publicsale.connect(addr2).purchase(20n);
      //=========================================================//

      //=========================================================//
      await time.increase(604800);
      //=========================================================//

      //=========================================================//
      const  publicsaleInfo = await publicsale.publicsale_info();
      const  publicsaleStatus = await publicsale.publicsale_status();
      const TOTAL_BASE_COLLECTED = publicsaleStatus.TOTAL_BASE_COLLECTED;
      const SOFT_CAP = publicsaleInfo.SOFTCAP;
      //=========================================================//

      expect(TOTAL_BASE_COLLECTED >= SOFT_CAP).to.equal(true, "Claim not allowed")
      expect(publicsale.connect(addr1).claim())

      // publicsale.connect(addr1).claim();
      // publicsale.connect(addr2).claim();
      // publicsale.connect(addr3).claim() 
      // const isForcedFailed = publicsaleStatus.FORCE_FAILED;
      // console.log ("isForcedFailed", isForcedFailed)

    })
    it ("Should not be claimable by exceeding hard cap", async function () {
      const { publicsale, owner, addr1, addr2, addr3, base_token, sale_token} = await loadFixture(deployContractAndSetVariablesV2);

      //=========================================================//
      await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(owner).deposit(10000);
      //=========================================================//

      try {

      //=========================================================//
      await base_token.connect(addr1).approve(publicsale.getAddress(),100);
      await base_token.connect(addr2).approve(publicsale.getAddress(),100);
      await base_token.connect(addr3).approve(publicsale.getAddress(),100);

      await publicsale.connect(addr1).purchase(20n);
      await publicsale.connect(addr1).purchase(20n);
      await publicsale.connect(addr2).purchase(20n);
      await publicsale.connect(addr2).purchase(20n);
      await publicsale.connect(addr3).purchase(20n);
      await publicsale.connect(addr3).purchase(20n);
      //=========================================================//
      const  publicsaleInfo = await publicsale.publicsale_info();
      const  publicsaleStatus = await publicsale.publicsale_status();
      const TOTAL_BASE_COLLECTED = publicsaleStatus.TOTAL_BASE_COLLECTED;
      const HARD_CAP = publicsaleInfo.HARDCAP;
      //=========================================================//
      expect(publicsale.connect(addr1).claim()).to.be.revertedWithCustomError(
        publicsale,
        "HardCapExceed"
      ).withArgs(HARD_CAP - TOTAL_BASE_COLLECTED);

      }  catch (error) {
        console.log(error);
      }
    })
    it("Should not be claimable by user doesn't own token", async function () {
      const { publicsale, owner, addr1, addr2, addr3, base_token, sale_token} = await loadFixture(deployContractAndSetVariablesV2);

      //=========================================================//
      await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(owner).deposit(10000);
      //=========================================================//

      try {
        //=========================================================//
        await base_token.connect(addr1).approve(publicsale.getAddress(),100);
        await base_token.connect(addr2).approve(publicsale.getAddress(),100);
        await base_token.connect(addr3).approve(publicsale.getAddress(),100);

        await publicsale.connect(addr1).purchase(20n);
        await publicsale.connect(addr1).purchase(20n);
        await publicsale.connect(addr1).purchase(10n);
        await publicsale.connect(addr2).purchase(20n);
        await publicsale.connect(addr2).purchase(20n);
        await publicsale.connect(addr2).purchase(10n);
        //=========================================================//

        expect(publicsale.connect(addr2).claim()).to.be.revertedWithCustomError(
          publicsale,
          "NotClaimable"
        )

      }  catch (error) {
        console.log(error);
      }
    })
    //TODO: 
    it("Should not be claimable by total tokens not enough token to claim", async function () {
      
    })

    // it("Should be updated sale amount in buyer address ", async function() {
    //   const { publicsale, owner, addr1, addr2, addr3, base_token, sale_token} = await loadFixture(deployContractAndSetVariablesV2);

    //   //=========================================================//
    //   await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
    //   await publicsale.connect(owner).deposit(10000);
    //   //=========================================================//

    //   //=========================================================//
    //   await base_token.connect(addr1).approve(publicsale.getAddress(),100);
    //   await base_token.connect(addr2).approve(publicsale.getAddress(),100);
    //   await base_token.connect(addr3).approve(publicsale.getAddress(),100);

    //   await publicsale.connect(addr1).purchase(20n);
    //   await publicsale.connect(addr1).purchase(20n);
    //   await publicsale.connect(addr2).purchase(20n);
    //   await publicsale.connect(addr2).purchase(20n);
    //   await publicsale.connect(addr3).purchase(20n);

    //   publicsale.connect(addr2).claim()

    //   //=========================================================//
    //   const  publicsaleInfo = await publicsale.publicsale_info();
    //   const  publicsaleStatus = await publicsale.publicsale_status();
    //   const _token_rate = await publicsaleInfo.TOKEN_RATE;
    //   const balance = await sale_token.connect(addr2).balanceOf(addr2);
    //   console.log('Balance:', balance.toString());
    //   console.log('Expected:', (20n * _token_rate).toString());
      
    //   expect(balance.toString()).to.equal((20n * _token_rate).toString());

    // })
  })  
})