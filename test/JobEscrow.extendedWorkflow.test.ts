import { expect } from "chai";
import { ethers } from "hardhat";

describe("JobEscrow Extended Workflow Tests", function () {
  let factory: any;
  let sbt: any;
  let client: any;
  let freelancer: any;
  let stranger: any;
  let job: any;

  beforeEach(async function () {
    [client, freelancer, stranger] = await ethers.getSigners();

    const jobImpl = await ethers.deployContract("JobEscrow");
    await jobImpl.waitForDeployment();

    sbt = await ethers.deployContract("ReputationSBT", [client.address]);
    await sbt.waitForDeployment();

    factory = await ethers.deployContract("JobFactory", [
      await jobImpl.getAddress(),
      await sbt.getAddress(),
    ]);
    await factory.waitForDeployment();

    await factory.connect(client).postJob("ipfs://extended-workflow-job", ethers.ZeroAddress);
    const jobs = await factory.getAllJobs();
    job = await ethers.getContractAt("JobEscrow", jobs[jobs.length - 1]);

    await job.connect(client).fundJob(0, { value: ethers.parseEther("1.0") });
    await job.connect(freelancer).applyToJob("ipfs://proposal");
    await job.connect(client).selectFreelancer(freelancer.address);
  });

  it("allows freelancer to post progress updates during active work", async function () {
    await expect(job.connect(freelancer).postProgressUpdate("ipfs://update-1"))
      .to.emit(job, "ProgressUpdatePosted")
      .withArgs(0, "ipfs://update-1", (val: bigint) => val > 0n);

    expect(await job.progressUpdateHashes(0)).to.equal("ipfs://update-1");

    await expect(job.connect(stranger).postProgressUpdate("ipfs://fake-update"))
      .to.be.revertedWith("Only freelancer posts progress");
  });

  it("client can approve a time extension, extending the review period", async function () {
    const initialReviewPeriod = await job.reviewPeriod();

    await expect(job.connect(freelancer).requestTimeExtension(5, "ipfs://extension-reason"))
      .to.emit(job, "TimeExtensionRequested")
      .withArgs(0, 5, "ipfs://extension-reason");

    await expect(job.connect(client).respondToTimeExtension(0, true))
      .to.emit(job, "TimeExtensionResponded")
      .withArgs(0, true);

    const updatedReviewPeriod = await job.reviewPeriod();
    expect(updatedReviewPeriod - initialReviewPeriod).to.equal(5n * 24n * 3600n);

    const req = await job.extensionRequests(0);
    expect(req.responded).to.be.true;
    expect(req.approved).to.be.true;
  });

  it("client can reject a time extension, review period unchanged", async function () {
    const initialReviewPeriod = await job.reviewPeriod();

    await job.connect(freelancer).requestTimeExtension(3, "ipfs://need-more-time");
    await job.connect(client).respondToTimeExtension(0, false);

    const updatedReviewPeriod = await job.reviewPeriod();
    expect(updatedReviewPeriod).to.equal(initialReviewPeriod);

    const req = await job.extensionRequests(0);
    expect(req.responded).to.be.true;
    expect(req.approved).to.be.false;
  });

  it("rejects unreasonable extension requests (>90 days)", async function () {
    await expect(
      job.connect(freelancer).requestTimeExtension(91, "ipfs://too-long")
    ).to.be.revertedWith("Unreasonable extension request");
  });

  it("requestModifications reopens Submitted back to Selected", async function () {
    await job.connect(freelancer).submitWork("Title", "Desc", ["ipfs://ev-1"]);
    expect(await job.status()).to.equal(2); // Submitted

    await expect(job.connect(client).requestModifications("ipfs://mod-note"))
      .to.emit(job, "ModificationRequested");

    expect(await job.status()).to.equal(1); // Selected (reopened)

    // Freelancer can resubmit work after modifications
    await job.connect(freelancer).submitWork("Title v2", "Desc v2", ["ipfs://ev-2"]);
    expect(await job.status()).to.equal(2); // Submitted
  });
});
