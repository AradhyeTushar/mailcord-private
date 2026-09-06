import mongoose from 'mongoose';
import Datastore from 'nedb-promises';
import path from 'path';
import fs from 'fs';

const isLite = !process.env.MONGODB_URI || process.env.MONGODB_URI === '';

let isMongooseConnected = false;

export async function connectDB() {
  const dataDir = path.join(process.cwd(), 'data', 'db');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (isLite) {
    console.log('[DB] Running in LITE mode (NeDB). No MongoDB required.');
    return;
  }
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mailcord';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    isMongooseConnected = true;
    console.log(`[DB] Connected to MongoDB at ${mongoUri}`);
  } catch (err) {
    console.warn('[DB] Could not connect to MongoDB. Gracefully falling back to local LITE mode (NeDB).');
    isMongooseConnected = false;
  }
}

// --- NeDB Wrapper for Mongoose Compatibility ---
function createLiteModel(name: string) {
  const filename = path.join(process.cwd(), 'data', 'db', `${name.toLowerCase()}.db`);
  const ds = Datastore.create({ filename, autoload: true });
  
  // Return an object that mimics basic Mongoose model behavior
  return {
    find: (query = {}) => {
        const chain = ds.find(query);
        (chain as any).sort = function(s: any) { return ds.find(query).sort(s); };
        (chain as any).limit = function(l: number) { return ds.find(query).limit(l); };
        (chain as any).lean = function() { return this; };
        return chain;
    },
    findOne: (query = {}) => {
        const chain = ds.findOne(query);
        (chain as any).lean = function() { return this; };
        return chain;
    },
    create: (data: any) => ds.insert(data),
    updateOne: (query: any, update: any) => ds.update(query, update, { multi: false }),
    updateMany: (query: any, update: any) => ds.update(query, update, { multi: true }),
    deleteOne: (query: any) => ds.remove(query, { multi: false }),
    deleteMany: (query: any) => ds.remove(query, { multi: true }),
    countDocuments: (query = {}) => ds.count(query),
    findOneAndUpdate: (query: any, update: any, options: any) => ds.update(query, update, { upsert: options?.upsert, returnUpdatedDocs: true }),
  };
}

// --- Schemas (Only used for Mongoose mode) ---
const aliasSchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, default: 'bot.devtushar.uk' },
  ownerId: { type: String, required: true, index: true },
  status: { type: String, required: true, index: true },
  locked: { type: Boolean, default: false },
  emailsReceived: { type: Number, default: 0 },
  createdAt: { type: Number, default: () => Date.now() },
  deletedAt: { type: Number },
  expiresAt: { type: Number },
  privacyMode: { type: Boolean, default: false },
  filters: { type: [String], default: [] },
  forwardTo: { type: String },
  webhookUrl: { type: String }
});

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  mobileNumber: { type: String },
  guilds: { type: mongoose.Schema.Types.Mixed, default: {} },
  notify: { type: Boolean, default: true },
  notifyKeywords: { type: [String], default: [] },
  privacyMode: { type: Boolean, default: false },
  plan: { type: String, enum: ['free', 'premium', 'supreme'], default: 'free' },
  razorpayCustomerId: { type: String },
  razorpaySubscriptionId: { type: String },
  expiresAt: { type: Date },
  recoveryEmail: { type: String },
  recoveryPhone: { type: String },
  privateAliasDestination: { type: String },
  lastRestoreTime: { type: Number },
  managedGuilds: { type: [{ id: String, name: String, icon: String }], default: [] }
});

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' },
  adminRoleId: { type: String },
  managerRoleId: { type: String },
  supportRoleId: { type: String },
  viewerRoleId: { type: String },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  razorpayCustomerId: { type: String },
  razorpaySubscriptionId: { type: String },
  expiresAt: { type: Date },
  setupCompleted: { type: Boolean, default: false }
});

const emailSchema = new mongoose.Schema({
  alias: { type: String, required: true, index: true },
  domain: { type: String, default: 'bot.devtushar.uk' },
  from: { type: String },
  subject: { type: String },
  body: { type: String },
  timestamp: { type: Number, default: () => Date.now() },
  expiresAt: { type: Number },
  guildId: { type: String },
  spamScore: { type: Number, default: 0 },
  category: { type: String },
  summary: { type: String }
});

const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  targetId: { type: String },
  type: { type: String, enum: ['user', 'guild'], required: true },
  plan: { type: String, required: true },
  status: { type: String, enum: ['active', 'cancelled', 'past_due', 'created'], default: 'created' },
  paymentProvider: { type: String, default: 'razorpay' },
  providerOrderId: { type: String, index: true },
  providerSubscriptionId: { type: String },
  renewalDate: { type: Date },
  amount: { type: Number },
  currency: { type: String, default: 'INR' },
  createdAt: { type: Date, default: () => new Date() }
});

const domainSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  guildId: { type: String },
  domain: { type: String, required: true, unique: true },
  isSystem: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'pending', 'error'], default: 'active' },
  verified: { type: Boolean, default: false },
  mxConfigured: { type: Boolean, default: false },
  txtConfigured: { type: Boolean, default: false },
  createdAt: { type: Date, default: () => new Date() }
});

function getModel(name: string, schema: any) {
  const lite = createLiteModel(name);
  if (isLite) return lite;

  let mModel: any = null;
  try {
    mModel = mongoose.models[name] || mongoose.model(name, schema);
  } catch (e) {
    return lite;
  }

  const dummyTarget = function (this: any, ...args: any[]) {
    if (isMongooseConnected && mongoose.connection.readyState === 1 && mModel) {
      return new mModel(...args);
    }
    return (lite as any)(...args);
  };

  return new Proxy(dummyTarget, {
    get(_, prop) {
      if (isMongooseConnected && mongoose.connection.readyState === 1 && mModel) {
        const val = mModel[prop];
        if (typeof val === 'function') {
          return val.bind(mModel);
        }
        return val;
      }
      const val = (lite as any)[prop];
      if (typeof val === 'function') {
        return val.bind(lite);
      }
      return val;
    },
    construct(_, args) {
      if (isMongooseConnected && mongoose.connection.readyState === 1 && mModel) {
        return new mModel(...args);
      }
      return (lite as any)(...args);
    },
    apply(_, thisArg, args) {
      if (isMongooseConnected && mongoose.connection.readyState === 1 && mModel) {
        return new mModel(...args);
      }
      return (lite as any)(...args);
    }
  });
}

// --- Exports ---
export const Alias: any = getModel('Alias', aliasSchema);
export const User: any = getModel('User', userSchema);
export const Guild: any = getModel('Guild', guildSchema);
export const Email: any = getModel('Email', emailSchema);
export const Subscription: any = getModel('Subscription', subscriptionSchema);
export const Domain: any = getModel('Domain', domainSchema);


// --- Missing Models ported from NebulaMailCord ---

const mailthreadSchema = new mongoose.Schema({}, { strict: false });
export const MailThread: any = getModel('MailThread', mailthreadSchema);

const mailblockSchema = new mongoose.Schema({}, { strict: false });
export const MailBlock: any = getModel('MailBlock', mailblockSchema);

const destinationSchema = new mongoose.Schema({}, { strict: false });
export const Destination: any = getModel('Destination', destinationSchema);

const upgradekeySchema = new mongoose.Schema({}, { strict: false });
export const UpgradeKey: any = getModel('UpgradeKey', upgradekeySchema);
