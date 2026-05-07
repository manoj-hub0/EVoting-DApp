const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

  const election = await hre.ethers.getContractAt("Election", contractAddress);

  await (await election.addCandidate(1, "manoz")).wait();
  console.log("Added candidate 1");

  await (await election.addCandidate(2, "mano")).wait();
  console.log("Added candidate 2");

  await (await election.startElection()).wait();
  console.log("Election started on blockchain");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});