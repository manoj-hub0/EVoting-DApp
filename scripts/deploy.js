const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function updateEnvFile(filePath, key, value, extraDefaults = {}) {
  let content = "";

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  }

  const lines = content
    .split("\n")
    .filter((line) => line.trim() !== "");

  const envMap = {};

  for (const line of lines) {
    const idx = line.indexOf("=");
    if (idx !== -1) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      envMap[k] = v;
    }
  }

  for (const [k, v] of Object.entries(extraDefaults)) {
    if (!envMap[k]) envMap[k] = v;
  }

  envMap[key] = value;

  const newContent =
    Object.entries(envMap)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n";

  fs.writeFileSync(filePath, newContent, "utf8");
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  const Election = await hre.ethers.getContractFactory("Election");
  const election = await Election.deploy();
  await election.waitForDeployment();

  const contractAddress = await election.getAddress();

  console.log("Election deployed to:", contractAddress);

  // Add candidates on-chain automatically
  await (await election.addCandidate(1, "manoz")).wait();
  console.log("Added candidate 1: manoz");

  await (await election.addCandidate(2, "mano")).wait();
  console.log("Added candidate 2: mano");

  // Start election on-chain automatically
  await (await election.startElection()).wait();
  console.log("Election started on blockchain");

  const rootDir = path.join(__dirname, "../..");
  const clientEnvPath = path.join(rootDir, "client", ".env");
  const serverEnvPath = path.join(rootDir, "server", ".env");

  await updateEnvFile(clientEnvPath, "VITE_CONTRACT_ADDRESS", contractAddress, {
    VITE_API_URL: "http://localhost:5001/api"
  });

  await updateEnvFile(serverEnvPath, "CONTRACT_ADDRESS", contractAddress, {
    PORT: "5001",
    MONGO_URI: "mongodb://127.0.0.1:27017/uel_evoting",
    JWT_SECRET: "change_this_secret",
    ADMIN_EMAIL: "admin@uel.local",
    ADMIN_PASSWORD: "Admin123!",
    RPC_URL: "http://127.0.0.1:8545"
  });

  console.log("Updated client/.env automatically");
  console.log("Updated server/.env automatically");
  console.log("Done");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});