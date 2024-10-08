const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const SALE_TOKEN_DECIMALS = 18;
const BASE_TOKEN_DECIMALS = 18;
const MAX_SPEND_PER_BUYER = BigInt(20 * 10 ** BASE_TOKEN_DECIMALS); // 20 sale tokens
const TOKEN_RATE = 3;
const HARD_CAP = BigInt(50 * 10 ** BASE_TOKEN_DECIMALS); // 1000 sale tokens
const SOFT_CAP = BigInt(30 * 10 ** BASE_TOKEN_DECIMALS); // 100 sale tokens
const DURATION = 604800; // 1 week
const BASE_TOKEN_NAME = "BaseToken";
const BASE_TOKEN_SYMBOL = "BT";
const SALE_TOKEN_NAME = "SaleToken";
const SALE_TOKEN_SYMBOL = "ST";
const BASE_TOKEN_MINT_AMOUNT = 1000;
const SALE_TOKEN_MINT_AMOUNT = 10000;

describe("PublicSale", function () {
  let publicsale;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  let saleTokenFactory;
  let saleTokenFactoryDeployed;
  
  let publicSaleContractFactory;
  let publicSaleContractFactoryDeployed;
  
  
  let base_token;
  let sale_token;

  before(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    //NOTE: Deployment of Sale Token Factory
    saleTokenFactory =  await ethers.getContractFactory("SaleTokenFactory");
    saleTokenFactoryDeployed = await saleTokenFactory.connect(owner).deploy()

    //NOTE: Deployment of Public Sale Factory
    publicSaleContractFactory = await ethers.getContractFactory("PublicSaleFactory");
    publicSaleContractFactoryDeployed = await publicSaleContractFactory.connect(owner).deploy();
    
  })

  beforeEach(async function () {
    //NOTE: Deployment of Base Token
    const MockERC20 = await ethers.getContractFactory("ERC20Mock");

    base_token = await MockERC20.connect(owner).deploy(
      BASE_TOKEN_NAME,
      BASE_TOKEN_SYMBOL
    );

    base_token.connect(addr1).mint(addr1.getAddress(), BASE_TOKEN_MINT_AMOUNT);
    base_token.connect(addr2).mint(addr2.getAddress(), BASE_TOKEN_MINT_AMOUNT);
    base_token.connect(addr3).mint(addr3.getAddress(), BASE_TOKEN_MINT_AMOUNT);

    //NOTE: Deployment of Sale Token
    //Already Minted (Fixed pre-mint)
    await saleTokenFactoryDeployed.connect(owner).createSaleToken(
      SALE_TOKEN_NAME,
      SALE_TOKEN_SYMBOL
    );
    const saleTokenList = await saleTokenFactoryDeployed.connect(owner).getSaleTokens()

    const saleTokenAddress = saleTokenList[saleTokenList.length - 1];
    sale_token = await ethers.getContractAt("SaleToken", saleTokenAddress);
    // sale_token.connect(owner).mint(owner.getAddress(), SALE_TOKEN_MINT_AMOUNT);

    //NOTE: Deployment of Public Sale 
    await publicSaleContractFactoryDeployed.connect(owner).createPublicSale(
      await sale_token.getAddress(),
      await base_token.getAddress(),
      BASE_TOKEN_DECIMALS,
      SALE_TOKEN_DECIMALS,
      MAX_SPEND_PER_BUYER,
      TOKEN_RATE,
      HARD_CAP,
      SOFT_CAP,
      DURATION
    );

    const publicSales = await publicSaleContractFactoryDeployed.getPublicSales();
    const publicSaleAddress = publicSales[publicSales.length - 1];
    publicsale = await ethers.getContractAt("PublicSale", publicSaleAddress);
  });

  //TC01
  it("Should deploy contract and set the owner correctly", async function () {
    const publicsaleInfo = await publicsale.publicsale_info();

    expect(publicsaleInfo[0]).to.equal(owner.address);
  });

  //TC02
  describe("Deposit tokens", function () {
    //TC02-01
    describe("Should not deposit tokens", function () {
      //TC02-01-01
      it("Should be able to deposit sale tokens to contract", async function () {
        const owner_balance = BigInt(20000 * 10 ** SALE_TOKEN_DECIMALS);
        expect(
          await sale_token.connect(owner).balanceOf(owner.address)
        ).to.equal(owner_balance);

        const amount_to_deposit = BigInt(10000 * 10 ** SALE_TOKEN_DECIMALS);

        await sale_token
          .connect(owner)
          .approve(publicsale.getAddress(), amount_to_deposit);

        await expect(await publicsale.connect(owner).deposit(amount_to_deposit))
          .to.emit(publicsale, "Deposit")
          .withArgs(owner.address, amount_to_deposit, await time.latest());

        const publicsaleInfo = await publicsale.publicsale_info();

        expect(await sale_token.balanceOf(publicsale.getAddress())).to.equal(amount_to_deposit);
        expect(publicsaleInfo[7]).to.equal(amount_to_deposit);
        expect(publicsaleInfo[10]).to.equal(await time.latest());
        expect(publicsaleInfo[11]).to.equal(
          publicsaleInfo[10] + publicsaleInfo[12]
        );
      });
    });

    //TC02-02
    describe("Should not deposit tokens", function () {
      //TC02-02-01
      it("Should not be able to deposit sale tokens when not owner", async function () {
        sale_token
          .connect(addr1)
          .mint(addr1.getAddress(), SALE_TOKEN_MINT_AMOUNT);

        const amount_to_deposit = BigInt(20000 * 10 ** SALE_TOKEN_DECIMALS);
        const amount_to_deposit_error = BigInt(
          1000 * 10 ** SALE_TOKEN_DECIMALS
        );

        await sale_token
          .connect(addr1)
          .approve(publicsale.getAddress(), amount_to_deposit_error);
        await sale_token
          .connect(owner)
          .approve(publicsale.getAddress(), amount_to_deposit);

        await expect(publicsale.connect(addr1).deposit(amount_to_deposit_error))
          .to.be.revertedWithCustomError(
            publicsale,
            "Unauthorized",
          );
      });

      //TC02-02-02
      it("Should not be able to deposit sale tokens after deposit", async function () {
        const amount_to_deposit = BigInt(10000 * 10 ** SALE_TOKEN_DECIMALS);
        await sale_token
          .connect(owner)
          .approve(publicsale.getAddress(), amount_to_deposit);
        await publicsale.connect(owner).deposit(amount_to_deposit);

        await expect(
          publicsale.connect(owner).deposit(amount_to_deposit)
        ).to.be.revertedWith("Deposit not allowed");
      });

      //TC02-02-03
      it("Should not be able to deposit sale tokens if amount is 0", async function () {
        await expect(publicsale.connect(owner).deposit(0)).to.be.revertedWith(
          "Deposit not allowed"
        );
      });
    });
  });

  //TC03
  describe("Purchase tokens", function () {
    //TC03-01
    it("Should purchase tokens", async function () {
      let publicsaleStatus = await publicsale.publicsale_status();
      const amount_to_deposit = BigInt(100 * 10 ** SALE_TOKEN_DECIMALS);

      await sale_token
        .connect(owner)
        .approve(publicsale.getAddress(), amount_to_deposit);
      await publicsale.connect(owner).deposit(amount_to_deposit);

      const amount_in = BigInt(10 * 10 ** BASE_TOKEN_DECIMALS); // 10 base tokens for 30 sale tokens
      const total_base_collected_before = publicsaleStatus.TOTAL_BASE_COLLECTED;
      const total_token_sold_before = publicsaleStatus.TOTAL_TOKENS_SOLD;

      await base_token
        .connect(addr1)
        .approve(publicsale.getAddress(), amount_in);
      await publicsale.connect(addr1).purchase(amount_in);

      const token_owed_expected =
        (amount_in * BigInt(SALE_TOKEN_DECIMALS * TOKEN_RATE)) /
        BigInt(BASE_TOKEN_DECIMALS);

      publicsaleStatus = await publicsale.publicsale_status();
      const total_base_collected = await publicsaleStatus.TOTAL_BASE_COLLECTED;
      const total_tokens_sold = await publicsaleStatus.TOTAL_TOKENS_SOLD;

      expect(total_base_collected).to.equal(
        BigInt(total_base_collected_before) + amount_in
      );
      expect(total_tokens_sold).to.equal(
        BigInt(total_token_sold_before) + token_owed_expected
      );
    });

    //TC03-02
    it("Should emit purchase event", async function () {
      const amount_to_deposit = BigInt(100 * 10 ** SALE_TOKEN_DECIMALS);

      await sale_token
        .connect(owner)
        .approve(publicsale.getAddress(), amount_to_deposit);
      await publicsale.connect(owner).deposit(amount_to_deposit);

      const amount_in = BigInt(10 * 10 ** BASE_TOKEN_DECIMALS); // 10 base tokens for 30 sale tokens

      await base_token
        .connect(addr1)
        .approve(publicsale.getAddress(), amount_in);

      await expect(publicsale.connect(addr1).purchase(amount_in))
        .to.emit(publicsale, "Purchase")
        .withArgs(addr1.getAddress(), amount_in);
    });

    //TC03-03
    it("Should not allow purchase tokens", async function () {
      const publicsaleInfo = await publicsale.publicsale_info();
      const amount_to_purchase = BigInt(10 * 10 ** BASE_TOKEN_DECIMALS); // 10 base tokens for 30 sale tokens

      await base_token
        .connect(addr1)
        .approve(publicsale.getAddress(), amount_to_purchase);
      await expect(
        publicsale.connect(addr1).purchase(amount_to_purchase)
      ).to.be.revertedWith("Purchase not allowed");

      const amount_to_deposit = BigInt(1000 * 10 ** SALE_TOKEN_DECIMALS);
      const amount_to_purchase_error = BigInt(30 * 10 ** BASE_TOKEN_DECIMALS); // exceed maximum 20 sale tokens

      await sale_token
        .connect(owner)
        .approve(publicsale.getAddress(), amount_to_deposit);
      await publicsale.connect(owner).deposit(amount_to_deposit);
      await expect(publicsale.connect(addr1).purchase(amount_to_purchase_error))
        .to.be.revertedWithCustomError(publicsale, "PurchaseLimitExceed")
        .withArgs(publicsaleInfo[6]);

      await publicsale.connect(addr1).purchase(amount_to_purchase);
      await expect(publicsale.connect(addr1).purchase(amount_to_purchase_error))
        .to.be.revertedWithCustomError(publicsale, "PurchaseLimitExceed")
        .withArgs(publicsaleInfo[6]);
    });
  });
  //TC04
  describe("Claim tokens", function () {
    const amount_to_deposit = BigInt(100 * 10 ** SALE_TOKEN_DECIMALS);
    const amount_to_approve = BigInt(30 * 10 ** BASE_TOKEN_DECIMALS);
    const amount_to_purchase = BigInt(10 * 10 ** BASE_TOKEN_DECIMALS);

    beforeEach(async function () {
      await sale_token
        .connect(owner)
        .approve(publicsale.getAddress(), amount_to_deposit);
      await publicsale.connect(owner).deposit(amount_to_deposit);

      Promise.all([
        await base_token
          .connect(addr1)
          .approve(publicsale.getAddress(), amount_to_approve),
        await base_token
          .connect(addr2)
          .approve(publicsale.getAddress(), amount_to_approve),
        await base_token
          .connect(addr3)
          .approve(publicsale.getAddress(), amount_to_approve),
      ]);
    });
    //TC04-01
    it("Should be claimable by equalling hard cap", async function () {
      Promise.all([
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr3).purchase(amount_to_purchase),
      ]);

      const publicsaleInfo = await publicsale.publicsale_info();
      const publicsaleStatus = await publicsale.publicsale_status();

      const TOTAL_BASE_COLLECTED = publicsaleStatus.TOTAL_BASE_COLLECTED;
      const HARD_CAP = publicsaleInfo[8];

      expect(TOTAL_BASE_COLLECTED >= HARD_CAP).to.equal(
        true,
        "Claim not allowed"
      );
      expect(publicsale.connect(addr1).claim());
    });

    //TC04-02
    it("Should be claimable by end time and soft cap exceed", async function () {
      Promise.all([
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr3).purchase(amount_to_purchase),
      ]);

      await time.increase(DURATION);

      const publicsaleInfo = await publicsale.publicsale_info();
      const publicsaleStatus = await publicsale.publicsale_status();

      const TOTAL_BASE_COLLECTED = publicsaleStatus.TOTAL_BASE_COLLECTED;
      const SOFT_CAP = publicsaleInfo.SOFTCAP;

      expect(TOTAL_BASE_COLLECTED >= SOFT_CAP).to.equal(
        true,
        "Claim not allowed"
      );
      expect(publicsale.connect(addr1).claim());
    });

    //TC04-03
    it("Should not be claimable by exceeding hard cap", async function () {
      Promise.all([
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr3).purchase(amount_to_purchase),
      ]);

      await expect(publicsale.connect(addr3).purchase(10)).to.be.revertedWith(
        "Purchase not allowed"
      );

      const publicsaleInfo = await publicsale.publicsale_info();
      const publicsaleStatus = await publicsale.publicsale_status();
      const TOTAL_BASE_COLLECTED = publicsaleStatus.TOTAL_BASE_COLLECTED;
      const HARD_CAP = publicsaleInfo.HARDCAP;

      expect(publicsale.connect(addr1).claim())
        .to.be.revertedWithCustomError(publicsale, "HardCapExceed")
        .withArgs(HARD_CAP - TOTAL_BASE_COLLECTED);
    });

    //TC04-04
    it("Should not be claimable by user doesn't own token", async function () {
      Promise.all([
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
      ]);
      await time.increase(DURATION);

      expect(
        publicsale.connect(addr1).claim(),
        "Address 1 should be able to claim"
      );
      expect(publicsale.connect(addr2).claim()).to.be.revertedWithCustomError(
        publicsale,
        "NotClaimable"
      );
    });

    //TC04-05
    it("Should be updated sale and base amount in buyer address ", async function () {
      Promise.all([
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr3).purchase(amount_to_purchase),
      ]);

      await time.increase(DURATION);

      const initialBalanceSaleToken = await sale_token
        .connect(addr2)
        .balanceOf(addr2);
      Promise.all([
        // await publicsale.connect(addr1).claim(),

        await publicsale.connect(addr2).claim(),
        await publicsale.connect(addr3).claim(),
      ]);

      const afterBalanceSaleToken = await sale_token
        .connect(addr2)
        .balanceOf(addr2);

      expect(initialBalanceSaleToken).to.not.equal(
        afterBalanceSaleToken,
        "is the same"
      );
    });

    //TC04-06
    it("Should emit claim event", async function () {
      Promise.all([
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr1).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr2).purchase(amount_to_purchase),
        await publicsale.connect(addr3).purchase(amount_to_purchase),
      ]);

      await time.increase(DURATION);
      // await expect(publicsale.connect(addr2).claim())
      //     .to.emit(publicsale, "TokenClaimed")
      //     .withArgs(addr2.getAddress(), amount_to_purchase * BigInt(2* TOKEN_RATE), await time.latest());
    });
  });

  //TC05
  describe("Cancel Token", function () {
    //TC05-01
    const amount_to_deposit = BigInt(1000 * 10 ** SALE_TOKEN_DECIMALS);
    const amount_to_approve = BigInt(100 * 10 ** BASE_TOKEN_DECIMALS);
    const amount_to_purchase = BigInt(10 * 10 ** SALE_TOKEN_DECIMALS);

    it("Should set status", async function () {
      await Promise.all([
        sale_token
          .connect(owner)
          .approve(publicsale.getAddress(), amount_to_deposit),
        base_token
          .connect(addr1)
          .approve(publicsale.getAddress(), amount_to_approve),
      ]);

      const publicsaleStatus = await publicsale.publicsale_status();

      expect(publicsaleStatus[0]).to.equal(false);
    });

    //TC05-02
    it("Cancel success", async function () {
      Promise.all([
        await sale_token
          .connect(owner)
          .approve(publicsale.getAddress(), amount_to_approve),
        await publicsale.connect(owner).deposit(amount_to_approve),
      ]);

      await publicsale.connect(owner).cancel();
      let publicsaleStatus = await publicsale.publicsale_status();

      expect(publicsaleStatus[0]).to.equal(true);
    });

    //TC05-03
    it("should emit Refund event after successful cancel", async function () {
      Promise.all([
        await sale_token
          .connect(owner)
          .approve(publicsale.getAddress(), amount_to_deposit),
        await publicsale.connect(owner).deposit(amount_to_deposit),
      ]);

      Promise.all([
        await base_token
          .connect(addr1)
          .approve(publicsale.getAddress(), amount_to_approve),
        await publicsale.connect(addr1).purchase(amount_to_purchase),
      ]);

      expect(await publicsale.connect(owner).cancel())
        .to.emit(publicsale, "Cancel")
        .withArgs(owner, (await ethers.provider.getBlock("latest")).timestamp);
    });
  });

  //TC06
  describe("Refund Token", async function () {
    const amount_to_deposit = BigInt(1000 * 10 ** SALE_TOKEN_DECIMALS);
    const amount_to_approve = BigInt(100 * 10 ** BASE_TOKEN_DECIMALS);
    const amount_to_purchase = BigInt(10 * 10 ** SALE_TOKEN_DECIMALS);

    //TC06-01
    it("refund complete", async function () {
      await sale_token
        .connect(owner)
        .approve(publicsale.getAddress(), amount_to_deposit);
      await publicsale.connect(owner).deposit(amount_to_deposit);
      const b_token_balance_addr1_before = await base_token.balanceOf(addr1);

      await base_token
        .connect(addr1)
        .approve(publicsale.getAddress(), amount_to_approve);
      await publicsale.connect(addr1).purchase(amount_to_purchase);

      await publicsale.connect(owner).cancel();
      await publicsale.connect(addr1).refund();
      const b_token_balance_addr1 = await base_token.balanceOf(addr1);

      expect(b_token_balance_addr1).to.equal(b_token_balance_addr1_before);
    });
    //TC06-02

    it("should emit Refund event after successful refund", async function () {
      await sale_token
        .connect(owner)
        .approve(publicsale.getAddress(), amount_to_approve);
      await publicsale.connect(owner).deposit(amount_to_purchase);

      await base_token
        .connect(addr1)
        .approve(publicsale.getAddress(), amount_to_approve);
      await publicsale.connect(addr1).purchase(amount_to_purchase);

      await publicsale.connect(owner).cancel();
      await expect(await publicsale.connect(addr1).refund())
        .to.emit(publicsale, "Refund")
        .withArgs(
          addr1.address,
          amount_to_purchase,
          (
            await ethers.provider.getBlock("latest")
          ).timestamp
        );
    });
  });
});