import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB connected");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    studentId: { type: String, unique: true },
    walletAddress: { type: String, unique: true },
    password: String,
    role: { type: String, default: "voter" },
    status: { type: String, default: "pending" },
    hasVoted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const candidateSchema = new mongoose.Schema(
  {
    candidateId: { type: Number, unique: true },
    name: String,
    party: String,
    manifesto: String,
    imageUrl: String
  },
  { timestamps: true }
);

const electionSchema = new mongoose.Schema(
  {
    title: { type: String, default: "UEL Student Election" },
    description: { type: String, default: "Hybrid blockchain voting election" },
    isActive: { type: Boolean, default: false },
    isEnded: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const voteLogSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    walletAddress: String,
    candidateId: Number,
    txHash: String
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Candidate = mongoose.model("Candidate", candidateSchema);
const Election = mongoose.model("Election", electionSchema);
const VoteLog = mongoose.model("VoteLog", voteLogSchema);

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, studentId, walletAddress, password } = req.body;
    if (!name || !email || !studentId || !walletAddress || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({
      $or: [{ email }, { studentId }, { walletAddress }]
    });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      studentId,
      walletAddress,
      password: hashed
    });

    res.status(201).json({
      message: "Registration submitted. Await admin approval.",
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        walletAddress: user.walletAddress,
        hasVoted: user.hasVoted
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/voter/candidates", async (req, res) => {
  const candidates = await Candidate.find().sort({ candidateId: 1 });
  res.json(candidates);
});

app.get("/api/voter/election", async (req, res) => {
  const election = await Election.findOne().sort({ createdAt: -1 });
  res.json(election);
});

app.post("/api/voter/vote", protect, async (req, res) => {
  try {
    const { candidateId, txHash } = req.body;

    if (req.user.status !== "approved") {
      return res.status(403).json({ message: "Voter not approved" });
    }

    if (req.user.hasVoted) {
      return res.status(400).json({ message: "Vote already recorded" });
    }

    const election = await Election.findOne().sort({ createdAt: -1 });
    if (!election || !election.isActive || election.isEnded) {
      return res.status(400).json({ message: "Election is not active" });
    }

    await VoteLog.create({
      userId: req.user._id,
      walletAddress: req.user.walletAddress,
      candidateId,
      txHash
    });

    req.user.hasVoted = true;
    await req.user.save();

    res.json({ message: "Vote recorded", txHash });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/admin/dashboard", protect, adminOnly, async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "voter" });
  const approvedUsers = await User.countDocuments({ role: "voter", status: "approved" });
  const pendingUsers = await User.countDocuments({ role: "voter", status: "pending" });
  const totalCandidates = await Candidate.countDocuments();
  const totalVoted = await User.countDocuments({ hasVoted: true });
  const election = await Election.findOne().sort({ createdAt: -1 });

  res.json({
    totalUsers,
    approvedUsers,
    pendingUsers,
    totalCandidates,
    totalVoted,
    election
  });
});

app.get("/api/admin/voters", protect, adminOnly, async (req, res) => {
  const voters = await User.find({ role: "voter" }).sort({ createdAt: -1 });
  res.json(voters);
});

app.patch("/api/admin/voters/:id/status", protect, adminOnly, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(user);
});

app.get("/api/admin/candidates", protect, adminOnly, async (req, res) => {
  const candidates = await Candidate.find().sort({ candidateId: 1 });
  res.json(candidates);
});

app.post("/api/admin/candidates", protect, adminOnly, async (req, res) => {
  const candidate = await Candidate.create(req.body);
  res.status(201).json(candidate);
});

app.put("/api/admin/election", protect, adminOnly, async (req, res) => {
  let election = await Election.findOne().sort({ createdAt: -1 });

  if (!election) {
    election = await Election.create(req.body);
  } else {
    Object.assign(election, req.body);
    await election.save();
  }

  res.json(election);
});

const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
if (!adminExists) {
  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  await User.create({
    name: "System Admin",
    email: process.env.ADMIN_EMAIL,
    studentId: "ADMIN-001",
    walletAddress: "ADMIN-WALLET",
    password: hashed,
    role: "admin",
    status: "approved"
  });
  console.log("Default admin created");
}

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
