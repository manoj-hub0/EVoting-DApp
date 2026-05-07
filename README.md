# UEL E-Voting DApp
Project Structure
UEL-EVoting-DApp/
│
├── client/          → React frontend
├── server/          → Node.js backend
├── blockchain/      → Smart contract + Hardhat
│
├── README.md

# Hybrid hybrid architecture system
- React frontend
- Node.js + Express backend
- MongoDB database
- Solidity smart contract
- MetaMask integration

# step 1
cd blockchain 
npm install
npx hardhat node

# Step 2
cd blockchain 
npx hardhat run scripts/deploy.js --network localhost

# Step 3
cd client
npm install
npm run dev

# Installtion
# Terminal 1
cd "/Users/manojchaudhary/Documents/EVoting_Project/blockchain"
npx hardhat node
# Terminal 2
cd "/Users/manojchaudhary/Documents/EVoting_Project/blockchain"
npx hardhat run scripts/deploy.js --network localhost
# Terminal 3
cd "/Users/manojchaudhary/Documents/EVoting_Project/server"
npm run dev
# Terminal 4
cd "/Users/manojchaudhary/Documents/EVoting_Project/client"
node ./node_modules/vite/bin/vite.js
# Metamask
MetaMask Setup

Add new network:

Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency: ETH

Import account using private key from Hardhat node.

# How to Use
# Admin Flow
Login as admin
Approve registered voters
Add candidates
Start election
End election
# Voter Flow
Register account
Wait for admin approval
Login
Connect MetaMask
Vote
# Results
After election ends
Results are fetched from blockchain
Winner is displayed

# security Features
JWT-based authentication
Password hashing
Wallet verification
Smart contract vote validation
One vote per wallet
# Limitations
Local blockchain resets on restart
Contract address changes after redeployment
Requires MetaMask
# Future Improvements
Persistent blockchain (e.g., Ganache or testnet)
Role-based access control
Election history tracking
Mobile application
Improved UI/UX
# Conclusion

This project demonstrates a hybrid approach combining traditional backend systems with blockchain technology to build a secure and transparent voting system.

It ensures:

Integrity of votes
Transparency of results
Controlled access via admin panel
Author

Manoj Chaudhary
University of East London