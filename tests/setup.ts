import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import Account from "../src/modules/auth/account.model.js";
import User from "../src/modules/users/user.model.js";
import UserStats from "../src/modules/users/userStat.model.js";

let replset: MongoMemoryReplSet;

// Fake env values — just enough to satisfy env.ts's Zod schema at import time.
// None of these need to be real; nothing in the test suite makes a genuine
// external call to Google/GitHub/Gmail (those are mocked below / not exercised).
process.env.NODE_ENV = "test";
process.env.PORT = "5000";
process.env.CLIENT_URL = "http://localhost:3000";
process.env.JWT_ACCESS_SECRET = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
process.env.JWT_REFRESH_SECRET = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
process.env.GOOGLE_CLIENT_ID = "test";
process.env.GOOGLE_CLIENT_SECRET = "test";
process.env.GOOGLE_CALLBACK_URL = "http://localhost:5000/api/v1/auth/oauth/google/callback";
process.env.GITHUB_CLIENT_ID = "test";
process.env.GITHUB_CLIENT_SECRET = "test";
process.env.GITHUB_CALLBACK_URL = "http://localhost:5000/api/v1/auth/oauth/github/callback";
process.env.CLOUDINARY_CLOUD_NAME = "test";
process.env.CLOUDINARY_API_KEY = "test";
process.env.CLOUDINARY_API_SECRET = "test";
process.env.EMAIL_USER = "test@example.com";
process.env.EMAIL_PASS = "test";


process.env.MONGO_URI = "mongodb://localhost:27017/test"; // unused since setup.ts connects via replset.getUri() directly, but still required by the schema
process.env.API_URL = "http://localhost:5000";
process.env.LINKEDIN_CLIENT_ID = "test";
process.env.LINKEDIN_CLIENT_SECRET = "test";
process.env.LINKEDIN_CALLBACK_URL = "http://localhost:5000/api/v1/auth/oauth/linkedin/callback";

// Never let a test suite send a real email.
vi.mock("../src/services/email.service.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));


beforeAll(async () => {
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replset.getUri());

  // .init() (not just .createCollection()) waits for BOTH the collection
  // to exist AND its indexes to finish building — Mongoose builds indexes
  // asynchronously in the background, so createCollection() alone could
  // still leave a window where the collection exists but an index is
  // mid-build right as the first transaction fires, triggering this same
  // "catalog changes" error from a different angle.
  await Account.init();
  await User.init();
  await UserStats.init();
});

// afterEach(async () => {
//   // Wipe all collections between tests so one test's data never leaks into the next.
//   const collections = mongoose.connection.collections;
//   for (const key in collections) {
//     await collections[key].deleteMany({});
//   }
// });

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await replset.stop();
});