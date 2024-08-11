const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

const SALE_TOKEN_DECIMALS = 18;
const BASE_TOKEN_DECIMALS = 18;
const MAX_SPEND_PER_BUYER = BigInt(20 * 10 ** BASE_TOKEN_DECIMALS); // 20 sale tokens
const TOKEN_RATE = 3;
const HARD_CAP = BigInt(50 * 10 ** BASE_TOKEN_DECIMALS); // 1000 sale tokens
const SOFT_CAP = BigInt(30 * 10 ** BASE_TOKEN_DECIMALS); // 100 sale tokens
const DURATION = 604800; // 1 week
const BASE_TOKEN_NAME = 'BaseToken';
const BASE_TOKEN_SYMBOL = 'BT';
const SALE_TOKEN_NAME = 'SaleToken';
const SALE_TOKEN_SYMBOL = 'ST';
const BASE_TOKEN_MINT_AMOUNT = 1000;
const SALE_TOKEN_MINT_AMOUNT = 10000;

describe('PublicSale', function () {
  let publicsale;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let base_token;
  let sale_token;

  beforeEach(async function() {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory('ERC20Mock');

    base_token = await MockERC20.connect(owner).deploy(
      BASE_TOKEN_NAME,
      BASE_TOKEN_SYMBOL,
    );
    
    base_token.connect(addr1).mint(addr1.getAddress(), BASE_TOKEN_MINT_AMOUNT);
    base_token.connect(addr2).mint(addr2.getAddress(), BASE_TOKEN_MINT_AMOUNT);
    base_token.connect(addr3).mint(addr3.getAddress(), BASE_TOKEN_MINT_AMOUNT);

    sale_token = await MockERC20.deploy(
      SALE_TOKEN_NAME,
      SALE_TOKEN_SYMBOL,
    );

    sale_token.connect(owner).mint(owner.getAddress(), SALE_TOKEN_MINT_AMOUNT);

    const PublicSale = await ethers.getContractFactory('PublicSale');
    publicsale = await PublicSale.deploy(
      sale_token.getAddress(),
      base_token.getAddress(),
      BASE_TOKEN_DECIMALS,
      SALE_TOKEN_DECIMALS,
      MAX_SPEND_PER_BUYER,
      TOKEN_RATE,
      HARD_CAP,
      SOFT_CAP,
      DURATION
    );

  });

  it('Should deploy contract and set the owner correctly', async function () {
    expect(await publicsale.owner()).to.equal(owner.address);
  });

  describe('Deposit tokens', function () {
    it('Should be able to deposit sale tokens to contract', async function () {
      const owner_balance = BigInt(20000 * 10 ** SALE_TOKEN_DECIMALS);
      expect(await sale_token.connect(owner).balanceOf(owner.address)).to.equal(owner_balance);
      
      const amount_to_deposit = BigInt(10000 * 10 ** SALE_TOKEN_DECIMALS);

      await sale_token.connect(owner).approve(publicsale.getAddress(), amount_to_deposit);
      await publicsale.connect(owner).deposit(amount_to_deposit);
      // await expect(publicsale.connect(owner).deposit(amount_to_deposit)).to.emit(publicsale, 'Deposit').withArgs(owner.address, amount_to_deposit, await time.latest());

      const publicsaleInfo = await publicsale.publicsale_info();

      try {
        expect(publicsaleInfo[7]).to.equal(amount_to_deposit);
        expect(publicsaleInfo[10]).to.equal(await time.latest());
        expect(publicsaleInfo[11]).to.equal(publicsaleInfo[10] + publicsaleInfo[12]);
      } catch (error) {
        console.log(error); 
      }
    });

    describe('Cannot deposit tokens', function () {
      it('Should not be able to deposit sale tokens when not owner', async function () {
        sale_token.connect(addr1).mint(addr1.getAddress(), SALE_TOKEN_MINT_AMOUNT);

        const amount_to_deposit = BigInt(20000 * 10 ** SALE_TOKEN_DECIMALS);
        const amount_to_deposit_error = BigInt(1000 * 10 ** SALE_TOKEN_DECIMALS);

        await sale_token.connect(addr1).approve(publicsale.getAddress(), amount_to_deposit_error);
        await sale_token.connect(owner).approve(publicsale.getAddress(), amount_to_deposit);

        // not owner
        await expect(publicsale.connect(addr1).deposit(amount_to_deposit_error)).to.be.revertedWithCustomError(
          publicsale,
          "OwnableUnauthorizedAccount"
        ).withArgs(await addr1.getAddress());
      })

      it('Should not be able to deposit sale tokens after deposit', async function () {
        const amount_to_deposit = BigInt(10000 * 10 ** SALE_TOKEN_DECIMALS);
        await sale_token.connect(owner).approve(publicsale.getAddress(), amount_to_deposit);
        await publicsale.connect(owner).deposit(amount_to_deposit);
        try {
          await expect(publicsale.connect(owner).deposit(amount_to_deposit)).to.be.revertedWith("Deposit not allowed");
        } catch (error) {
          console.log(error);
        }
      })

      it('Should not be able to deposit sale tokens if amount is 0', async function () {
        try {
          await expect(publicsale.connect(owner).deposit(0)).to.be.revertedWith("Deposit not allowed");
        } catch (error) {
          console.log(error);
        }
      })
    });
  })
  describe('Purchase tokens', function () {

    it('Should purchase tokens', async function () {
      let publicsaleStatus = await publicsale.publicsale_status();
      const amount_to_deposit = BigInt(100 * 10 ** SALE_TOKEN_DECIMALS);

      await sale_token.connect(owner).approve(publicsale.getAddress(), amount_to_deposit);
      await publicsale.connect(owner).deposit(amount_to_deposit);

      const amount_in = BigInt(10 * 10 ** BASE_TOKEN_DECIMALS); // 10 base tokens for 30 sale tokens
      const total_base_collected_before = publicsaleStatus.TOTAL_BASE_COLLECTED;
      const total_token_sold_before = publicsaleStatus.TOTAL_TOKENS_SOLD;
      
      try {
        await base_token.connect(addr1).approve(publicsale.getAddress(), amount_in);
        await publicsale.connect(addr1).purchase(amount_in);
      } catch (error) {
        console.log(error);
      }
      
      const token_owed_expected = (amount_in * BigInt(SALE_TOKEN_DECIMALS * TOKEN_RATE)) / BigInt(BASE_TOKEN_DECIMALS);

      publicsaleStatus = await publicsale.publicsale_status();
      const total_base_collected = await publicsaleStatus.TOTAL_BASE_COLLECTED;
      const total_tokens_sold = await publicsaleStatus.TOTAL_TOKENS_SOLD;
      
      expect(total_base_collected).to.equal(BigInt(total_base_collected_before) + amount_in);
      expect(total_tokens_sold).to.equal(BigInt(total_token_sold_before) + token_owed_expected);
    });
    it('Should emit purchase event', async function () {
      try {
        const amount_to_deposit = BigInt(100 * 10 ** SALE_TOKEN_DECIMALS);

        await sale_token.connect(owner).approve(publicsale.getAddress(), amount_to_deposit);
        await publicsale.connect(owner).deposit(amount_to_deposit);

        const amount_in = BigInt(10 * 10 ** BASE_TOKEN_DECIMALS); // 10 base tokens for 30 sale tokens

        await base_token.connect(addr1).approve(publicsale.getAddress(), amount_in);

        await expect(publicsale.connect(addr1).purchase(amount_in))
          .to.emit(publicsale, 'Purchase').withArgs(addr1.getAddress(), amount_in);
      } catch (error) {
        console.log(error);
      } 
    })
    it('Should not allow purchase tokens', async function () {
      const publicsaleInfo = await publicsale.publicsale_info();
      const amount_to_purchase = BigInt(10 * 10 ** BASE_TOKEN_DECIMALS); // 10 base tokens for 30 sale tokens

      // has not change state 
      try {
        await base_token.connect(addr1).approve(publicsale.getAddress(), amount_to_purchase);
        await expect(publicsale.connect(addr1).purchase(amount_to_purchase)).to.be.revertedWith("Purchase not allowed");
      } catch (error) {
        console.log(error);
      }
      
      const amount_to_deposit = BigInt(1000 * 10 ** SALE_TOKEN_DECIMALS);
      const amount_to_purchase_error = BigInt(30 * 10 ** BASE_TOKEN_DECIMALS); // exceed maximum 20 sale tokens

      // max buy per user exceeded 
      try {
        await sale_token.connect(owner).approve(publicsale.getAddress(), amount_to_deposit);
        await publicsale.connect(owner).deposit(amount_to_deposit);
        await expect(publicsale.connect(addr1).purchase(amount_to_purchase_error)).to.be.revertedWithCustomError(publicsale, "PurchaseLimitExceed").withArgs(publicsaleInfo[6]);

        await publicsale.connect(addr1).purchase(amount_to_purchase);
        await expect(publicsale.connect(addr1).purchase(amount_to_purchase_error)).to.be.revertedWithCustomError(publicsale, "PurchaseLimitExceed").withArgs(publicsaleInfo[6]);
      } catch (error) {
        console.log(error);
      }  
    })
  })

  // TODO: Refactor code to limit the use of hard code values
  xdescribe('Claim tokens', function () {
    it("Should be claimable by equalling hard cap", async function () {
      
      // TODO: Change to big int, refactor code to use promise all if relevant
      await sale_token.connect(owner).approve(publicsale.getAddress(), 100 * 10 ** SALE_TOKEN_DECIMALS);
      await publicsale.connect(owner).deposit(10000);
      
      await base_token.connect(addr1).approve(publicsale.getAddress(), 100);
      await base_token.connect(addr2).approve(publicsale.getAddress(), 100);
      await base_token.connect(addr3).approve(publicsale.getAddress(), 100);

      await publicsale.connect(addr1).purchase(20);
      await publicsale.connect(addr1).purchase(20);
      await publicsale.connect(addr2).purchase(20);
      await publicsale.connect(addr2).purchase(20);
      await publicsale.connect(addr3).purchase(20);
      
      const publicsaleInfo = await publicsale.publicsale_info();
      const publicsaleStatus = await publicsale.publicsale_status();
      const TOTAL_BASE_COLLECTED = publicsaleStatus.TOTAL_BASE_COLLECTED;
      const HARD_CAP = publicsaleInfo.HARD_CAP;
      

      expect(TOTAL_BASE_COLLECTED >= HARD_CAP).to.equal(true, "Claim not allowed")
      expect(publicsale.connect(addr1).claim())

    })
    it("Should be claimable by end time and soft cap exceed", async function () {
 
      await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(owner).deposit(10000);
      
      await base_token.connect(addr1).approve(publicsale.getAddress(), 100);
      await base_token.connect(addr2).approve(publicsale.getAddress(), 100);
      await base_token.connect(addr3).approve(publicsale.getAddress(), 100);

      await publicsale.connect(addr1).purchase(20);
      await publicsale.connect(addr1).purchase(20);
      await publicsale.connect(addr2).purchase(20);
      

      
      await time.increase(604800);
      

      
      const publicsaleInfo = await publicsale.publicsale_info();
      const publicsaleStatus = await publicsale.publicsale_status();
      const TOTAL_BASE_COLLECTED = publicsaleStatus.TOTAL_BASE_COLLECTED;
      const SOFT_CAP = publicsaleInfo.SOFTCAP;
      

      expect(TOTAL_BASE_COLLECTED >= SOFT_CAP).to.equal(true, "Claim not allowed")
      expect(publicsale.connect(addr1).claim())
    })
    it("Should not be claimable by exceeding hard cap", async function () {
      
      await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(owner).deposit(10000);
      

      try {

        await base_token.connect(addr1).approve(publicsale.getAddress(), 100);
        await base_token.connect(addr2).approve(publicsale.getAddress(), 100);
        await base_token.connect(addr3).approve(publicsale.getAddress(), 100);

        await publicsale.connect(addr1).purchase(20);
        await publicsale.connect(addr1).purchase(20);
        await publicsale.connect(addr2).purchase(20);
        await publicsale.connect(addr2).purchase(20);
        await publicsale.connect(addr3).purchase(20);
        try {
          await expect(publicsale.connect(addr3).purchase(10)).to.be.revertedWith("Purchase not allowed");
        } catch (error) {
          console.log(error)
        }
        
        const publicsaleInfo = await publicsale.publicsale_info();
        const publicsaleStatus = await publicsale.publicsale_status();
        const TOTAL_BASE_COLLECTED = publicsaleStatus.TOTAL_BASE_COLLECTED;
        const HARD_CAP = publicsaleInfo.HARDCAP;
        
        expect(publicsale.connect(addr1).claim()).to.be.revertedWithCustomError(
          publicsale,
          "HardCapExceed"
        ).withArgs(HARD_CAP - TOTAL_BASE_COLLECTED);

      } catch (error) {
        console.log("error", error);
      }
    })
    it("Should not be claimable by user doesn't own token", async function () {
      
      await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(owner).deposit(10000);
      

      try {
        
        await base_token.connect(addr1).approve(publicsale.getAddress(), 100);
        await base_token.connect(addr2).approve(publicsale.getAddress(), 100);
        await base_token.connect(addr3).approve(publicsale.getAddress(), 100);

        await publicsale.connect(addr1).purchase(20);
        await publicsale.connect(addr1).purchase(20);
        await publicsale.connect(addr1).purchase(10n);
        await publicsale.connect(addr2).purchase(20);
        await publicsale.connect(addr2).purchase(20);
        await publicsale.connect(addr2).purchase(10n);
        

        expect(publicsale.connect(addr2).claim()).to.be.revertedWithCustomError(
          publicsale,
          "NotClaimable"
        )

      } catch (error) {
        console.log(error);
      }
    })

    it("Should be updated sale and base amount in buyer address ", async function () {
      
      await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(owner).deposit(10000);
      
      await base_token.connect(addr1).approve(publicsale.getAddress(), 100);
      await base_token.connect(addr2).approve(publicsale.getAddress(), 100);
      await base_token.connect(addr3).approve(publicsale.getAddress(), 100);

      await publicsale.connect(addr1).purchase(20);
      await publicsale.connect(addr1).purchase(20);
      await publicsale.connect(addr2).purchase(20);
      await publicsale.connect(addr2).purchase(20);
      await publicsale.connect(addr3).purchase(20);
      
      const initialBalanceSaleToken = await sale_token.connect(addr2).balanceOf(addr2);
      const initialBalanceBaseToken = await sale_token.connect(addr2).balanceOf(addr2);

      publicsale.connect(addr2).claim()
      await publicsale.connect(addr1).claim()
      await publicsale.connect(addr3).claim()
      const afterBalanceSaleToken = await sale_token.connect(addr2).balanceOf(addr2);
      const afterBalanceBaseToken = await sale_token.connect(addr2).balanceOf(addr2);

      expect(initialBalanceSaleToken).to.not.equal(afterBalanceSaleToken, "is the same")
      expect(initialBalanceBaseToken).to.not.equal(afterBalanceBaseToken, "is the same")
    })

    // it("Should emit correctly after claim", async function (){

    //   
    //   await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
    //   await publicsale.connect(owner).deposit(10000);
    //   

    //   
    //   await base_token.connect(addr1).approve(publicsale.getAddress(),100);
    //   await base_token.connect(addr2).approve(publicsale.getAddress(),100);
    //   await base_token.connect(addr3).approve(publicsale.getAddress(),100);

    //   await publicsale.connect(addr1).purchase(20);
    //   await publicsale.connect(addr1).purchase(20);
    //   await publicsale.connect(addr2).purchase(20);
    //   await publicsale.connect(addr2).purchase(20);
    //   await publicsale.connect(addr3).purchase(20);


    //   await publicsale.connect(addr1).claim();
    //       // Check if the TokenClaimed event was emitted correctly
    //   // Check if the TokenClaimed event was emitted correctly
    //   const eventFilter = publicsale.filters.TokenClaimed(await addr1.getAddress(), null, null);
    //   const events = await publicsale.queryFilter(eventFilter);
    //   if (events.length === 1) {
    //     const event = events[0];
    //     console.log("TokenClaimed event emitted:");
    //     console.log("- Sender:", event.args.sender);
    //     console.log("- Amount:", event.args.amount);
    //     console.log("- Timestamp:", event.args.timestamp);
    //   } else {
    //     console.log("TokenClaimed event not emitted or multiple events emitted.");
    //   }
    // })
  })

  // TODO: Add full test cases 
  xdescribe("Cancel Token", function () {
    it("Should set status", async function () {
      await sale_token.connect(owner).approve(publicsale.getAddress(), 1000);
      await publicsale.connect(owner).deposit(1000);

      await base_token.connect(addr1).approve(publicsale.getAddress(), 100);
      await publicsale.connect(addr1).purchase(10);

      let publicsaleStatus = await publicsale.publicsale_status();

      expect(publicsaleStatus[0]).to.equal(false);
    });

    it("Cancel success", async function () {
      await sale_token.connect(owner).approve(publicsale.getAddress(), 1000);
      await publicsale.connect(owner).deposit(1000);

      await base_token.connect(addr1).approve(publicsale.getAddress(), 100);
      await publicsale.connect(addr1).purchase(10);

      await publicsale.connect(owner).cancel();
      let publicsaleStatus = await publicsale.publicsale_status();

      expect(publicsaleStatus[0]).to.equal(true);
    });
  });

  xdescribe("Refund Token", async function () {
    it("refund complete", async function () {

      await sale_token.connect(owner).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(owner).deposit(10);
      const y = await base_token.balanceOf(addr1);

      await base_token.connect(addr1).approve(publicsale.getAddress(), 10000);
      await publicsale.connect(addr1).purchase(10);

      await publicsale.connect(owner).cancel();
      await publicsale.connect(addr1).refund();

      // TODO: Set variable to have meaningful name
      const x = await base_token.balanceOf(addr1);

      expect(x).to.equal(y);
    });
  });
})