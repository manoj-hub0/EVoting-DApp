const hre = require("hardhat");

async function main() {
  const contractAddress = "PASTE_LATEST_DEPLOYED_ADDRESS_HERE";

  const election = await hre.ethers.getContractAt("Election", contractAddress);

  await (await election.endElection()).wait();

  console.log("Election ended on blockchain");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});