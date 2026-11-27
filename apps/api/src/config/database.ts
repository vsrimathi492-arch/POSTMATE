import mongoose, { Model, Schema, model, models } from 'mongoose';
import fs from 'fs';
import path from 'path';

export interface DatabaseState {
  isConnected: boolean;
  isFallback: boolean;
  storagePath: string;
}

export const dbState: DatabaseState = {
  isConnected: false,
  isFallback: false,
  storagePath: path.resolve(__dirname, '../../../database/storage.json')
};

// ─── Mongoose Generic Collection Model ────────────────────────────────────────
// Stores each collection as a single atomic document (`_col` + `items`) so the
// synchronous repository layer persists reliably to MongoDB Atlas without
// deleteMany/insertMany race windows.

const genericDocSchema = new Schema(
  {
    _col: { type: String, required: true, unique: true, index: true },
    items: { type: Schema.Types.Mixed, default: [] },
    data: { type: Schema.Types.Mixed }
  },
  { timestamps: false, strict: false }
);

function getGenericModel(): Model<any> {
  return (models['PostmateDoc'] as Model<any>) || model<any>('PostmateDoc', genericDocSchema);
}

// ─── MongoDB-Backed Store (Serialized Per-Collection Queue) ──────────────────
class MongoStore {
  private writeQueues: Map<string, Promise<void>> = new Map();

  async getCollection(name: string): Promise<any[]> {
    try {
      const M = getGenericModel();
      const singleDoc: any = await M.findOne({ _col: name, items: { $exists: true } }).lean();
      if (singleDoc && Array.isArray(singleDoc.items)) {
        return singleDoc.items;
      }
      // Backward compatibility if multi-doc entries exist
      const docs = await M.find({ _col: name, data: { $exists: true } }).lean();
      return docs.map((d: any) => d.data || {});
    } catch (e) {
      console.error(`[MongoStore] getCollection(${name}) error:`, e);
      return [];
    }
  }

  enqueueSave(name: string, items: any[]): Promise<void> {
    const snapshot = items;
    const prev = this.writeQueues.get(name) || Promise.resolve();
    const next = prev
      .catch(() => undefined)
      .then(async () => {
        try {
          const M = getGenericModel();
          await M.findOneAndUpdate(
            { _col: name },
            { $set: { _col: name, items: snapshot } },
            { upsert: true }
          );
        } catch (e) {
          console.error(`[MongoStore] setCollection(${name}) error:`, e);
        }
      });
    this.writeQueues.set(name, next);
    return next;
  }

  async flush(): Promise<void> {
    await Promise.all(Array.from(this.writeQueues.values()));
  }
}

// ─── Local JSON File Database Fallback ────────────────────────────────────────
// Guarantees out-of-the-box zero-setup execution on local dev and demo fallback.
class LocalStore {
  private data: Record<string, any[]> = {
    users: [],
    offices: [],
    mailRecords: [],
    sortingBatches: [],
    deliveryAssignments: [],
    cashTransactions: [],
    dailyBalances: [],
    enquiries: [],
    notifications: [],
    auditLogs: [],
    dailyReports: []
  };

  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  private load() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = { ...this.data, ...JSON.parse(raw) };
      } else {
        this.save();
      }
    } catch (e) {
      console.warn('LocalStore load warning:', e);
    }
  }

  public save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('LocalStore save error:', e);
    }
  }

  public getCollection(name: string): any[] {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  public setCollection(name: string, items: any[]) {
    this.data[name] = items;
    this.save();
  }
}

// ─── Unified Store Proxy ────────────────────────────────────────────────────
// Repositories call localStore.getCollection() / setCollection().
// When MongoDB is connected, mutations are queued atomically to MongoDB Atlas
// while keeping the in-memory/local cache synchronized for fast reads.

const _localFileStore = new LocalStore(dbState.storagePath);
const _mongoStore = new MongoStore();

export const localStore = {
  getCollection(name: string): any[] {
    return _localFileStore.getCollection(name);
  },

  setCollection(name: string, items: any[]) {
    _localFileStore.setCollection(name, items);
    if (!dbState.isFallback && dbState.isConnected) {
      _mongoStore.enqueueSave(name, items);
    }
  },

  save() {
    _localFileStore.save();
  }
};

export async function flushMongoWrites(): Promise<void> {
  if (!dbState.isFallback && dbState.isConnected) {
    await _mongoStore.flush();
  }
}

// ─── Database Connection ────────────────────────────────────────────────────
export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!mongoUri) {
    console.log('[POSTMATE API] MONGODB_URI not set — using Local Persistence Store.');
    dbState.isConnected = true;
    dbState.isFallback = true;
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    const timeoutMs = process.env.NODE_ENV === 'production' ? 8000 : 2500;
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: timeoutMs
    });
    dbState.isConnected = true;
    dbState.isFallback = false;
    console.log(`[POSTMATE API] MongoDB Connected: ${conn.connection.host}`);

    await hydrateFromMongo();
  } catch (error: any) {
    console.warn(`[POSTMATE API] MongoDB unavailable (${error.message}). Activating robust Local Persistence Store fallback.`);
    dbState.isConnected = true;
    dbState.isFallback = true;
  }
}

// Pull existing collections from MongoDB into the in-memory store on startup.
async function hydrateFromMongo() {
  const collections = [
    'users', 'offices', 'mailRecords', 'sortingBatches',
    'deliveryAssignments', 'cashTransactions', 'dailyBalances',
    'enquiries', 'notifications', 'auditLogs', 'dailyReports'
  ];
  let hydratedCount = 0;
  for (const col of collections) {
    const items = await _mongoStore.getCollection(col);
    if (items.length > 0) {
      _localFileStore.setCollection(col, items);
      hydratedCount += items.length;
    }
  }
  console.log(`[POSTMATE API] Hydrated ${hydratedCount} records from MongoDB.`);
}
