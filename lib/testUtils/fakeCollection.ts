/**
 * A minimal in-memory stand-in for a Mongoose model, used to unit-test
 * concurrency-sensitive route logic without a real MongoDB deployment.
 *
 * The critical property this preserves is single-document atomicity:
 * findOneAndUpdate here has no `await` between reading the matching
 * document and writing to it, so its body runs to completion in one
 * synchronous pass — exactly like a real MongoDB findOneAndUpdate, which
 * is atomic per document. Two "concurrent" calls launched via
 * Promise.all() can only interleave *between* calls, never inside one,
 * so a compare-and-swap filter (e.g. `{ status: "pending" }`) genuinely
 * lets only one of two racing callers win — the same guarantee the real
 * database provides, and the actual thing several routes rely on.
 *
 * Read methods (find/findOne/findById) return a chainable query object
 * supporting the .select()/.populate()/.sort()/.lean() calls used around
 * the codebase — all no-ops here, since seed data is already shaped the
 * way a populated document would look — and the object is awaitable
 * (thenable) at any point in the chain, exactly like a real Mongoose
 * Query.
 *
 * Transaction rollback uses a per-session undo log rather than a
 * snapshot-and-restore of the whole collection: every mutating call made
 * with a `{ session }` option records the exact inverse of what it did,
 * and a failed transaction replays those inverses in reverse order. A
 * blanket "restore to how things looked when this transaction started"
 * would be wrong under real concurrency — if another transaction
 * committed in the meantime, restoring a stale snapshot would silently
 * erase its results. Targeted per-mutation undo doesn't have that
 * problem: each undo only touches what its own transaction changed.
 */

export type FakeFilter = Record<string, unknown>;
export type FakeUpdate = {
  $set?: Record<string, unknown>;
  $unset?: Record<string, unknown>;
  $push?: Record<string, unknown>;
  $inc?: Record<string, number>;
  [key: string]: unknown;
};

export interface FakeSession {
  recordUndo(fn: () => void): void;
  withTransaction(fn: () => Promise<void>): Promise<void>;
  endSession(): Promise<void>;
}

/** Pulls `{ session }` out of a Mongoose-style options argument typed as
 * `unknown` at call sites (matching the real Mongoose signature), without
 * forcing every mock wrapper across the test suite to import FakeSession. */
function extractSession(options: unknown): FakeSession | undefined {
  if (options && typeof options === "object" && "session" in options) {
    const session = (options as { session?: unknown }).session;
    if (session && typeof session === "object" && "recordUndo" in session) {
      return session as FakeSession;
    }
  }
  return undefined;
}

function isPlainOperatorObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !(v instanceof Date) && !Array.isArray(v);
}

function compare(a: unknown, b: unknown): number | null {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return null;
}

function matches<T>(doc: T, filter: FakeFilter): boolean {
  return Object.entries(filter).every(([key, cond]) => {
    if (key === "$or") {
      const branches = cond as FakeFilter[];
      return branches.some((branch) => matches(doc, branch));
    }
    const value = (doc as Record<string, unknown>)[key];
    if (isPlainOperatorObject(cond)) {
      if ("$ne" in cond) return value !== cond.$ne;
      if ("$in" in cond) return Array.isArray(cond.$in) && cond.$in.includes(value);
      if ("$exists" in cond) return cond.$exists ? value !== undefined : value === undefined;
      if ("$lt" in cond) {
        const c = compare(value, cond.$lt);
        return c !== null && c < 0;
      }
      if ("$lte" in cond) {
        const c = compare(value, cond.$lte);
        return c !== null && c <= 0;
      }
      if ("$gt" in cond) {
        const c = compare(value, cond.$gt);
        return c !== null && c > 0;
      }
      if ("$gte" in cond) {
        const c = compare(value, cond.$gte);
        return c !== null && c >= 0;
      }
      return false;
    }
    return value === cond;
  });
}

function restoreDoc(target: Record<string, unknown>, snapshot: Record<string, unknown>): void {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, snapshot);
}

function applyUpdate<T>(doc: T, update: FakeUpdate): void {
  const record = doc as Record<string, unknown>;

  // Mirrors real Mongoose: a plain update object with no top-level $
  // operators is treated as an implicit $set, never a raw MongoDB-style
  // full-document replacement (Mongoose only replaces when { overwrite:
  // true } is explicitly passed, which nothing in this codebase uses).
  const hasOperators = Object.keys(update).some((key) => key.startsWith("$"));
  if (!hasOperators) {
    Object.assign(record, update);
    return;
  }

  if (update.$set) {
    for (const [key, val] of Object.entries(update.$set)) {
      if (val === undefined) delete record[key];
      else record[key] = val;
    }
  }
  if (update.$unset) {
    for (const key of Object.keys(update.$unset)) {
      delete record[key];
    }
  }
  if (update.$push) {
    for (const [key, val] of Object.entries(update.$push)) {
      const arr = record[key];
      if (Array.isArray(arr)) arr.push(val);
      else record[key] = [val];
    }
  }
  if (update.$inc) {
    for (const [key, val] of Object.entries(update.$inc)) {
      record[key] = ((record[key] as number) || 0) + val;
    }
  }
}

export interface FakeQuery<R> extends PromiseLike<R> {
  select(): FakeQuery<R>;
  populate(): FakeQuery<R>;
  sort(): FakeQuery<R>;
  lean(): Promise<R>;
}

function makeQuery<R>(result: R): FakeQuery<R> {
  const resultPromise = Promise.resolve(result);
  const query: FakeQuery<R> = {
    select: () => query,
    populate: () => query,
    sort: () => query,
    lean: () => resultPromise,
    then: resultPromise.then.bind(resultPromise),
  };
  return query;
}

export function createFakeCollection<T extends { _id: string }>(seed: T[]) {
  const docs: T[] = seed.map((d) => structuredClone(d));

  return {
    docs,
    find(filter: FakeFilter = {}): FakeQuery<T[]> {
      const results = docs.filter((d) => matches(d, filter)).map((d) => structuredClone(d));
      return makeQuery(results);
    },
    findOne(filter: FakeFilter): FakeQuery<T | null> {
      const doc = docs.find((d) => matches(d, filter));
      return makeQuery(doc ? structuredClone(doc) : null);
    },
    findById(id: string): FakeQuery<T | null> {
      const doc = docs.find((d) => d._id === id);
      return makeQuery(doc ? structuredClone(doc) : null);
    },
    async findOneAndUpdate(filter: FakeFilter, update: FakeUpdate, options?: unknown): Promise<T | null> {
      const doc = docs.find((d) => matches(d, filter));
      if (!doc) return null;
      const before = structuredClone(doc) as Record<string, unknown>;
      extractSession(options)?.recordUndo(() => restoreDoc(doc as Record<string, unknown>, before));
      applyUpdate(doc, update);
      return structuredClone(doc);
    },
    async findByIdAndUpdate(id: string, update: FakeUpdate, options?: unknown): Promise<T | null> {
      const doc = docs.find((d) => d._id === id);
      if (!doc) return null;
      const before = structuredClone(doc) as Record<string, unknown>;
      extractSession(options)?.recordUndo(() => restoreDoc(doc as Record<string, unknown>, before));
      applyUpdate(doc, update);
      return structuredClone(doc);
    },
    async exists(filter: FakeFilter): Promise<{ _id: string } | null> {
      const doc = docs.find((d) => matches(d, filter));
      return doc ? { _id: doc._id } : null;
    },
    async deleteOne(filter: FakeFilter, options?: unknown): Promise<{ deletedCount: number }> {
      const index = docs.findIndex((d) => matches(d, filter));
      if (index === -1) return { deletedCount: 0 };
      const [removed] = docs.splice(index, 1);
      extractSession(options)?.recordUndo(() => {
        docs.push(removed);
      });
      return { deletedCount: 1 };
    },
    async deleteMany(filter: FakeFilter, options?: unknown): Promise<{ deletedCount: number }> {
      const removed: T[] = [];
      const remaining: T[] = [];
      for (const d of docs) {
        if (matches(d, filter)) removed.push(d);
        else remaining.push(d);
      }
      docs.length = 0;
      docs.push(...remaining);
      extractSession(options)?.recordUndo(() => {
        docs.push(...removed);
      });
      return { deletedCount: removed.length };
    },
    // Mirrors Mongoose's Model.create(): a single doc creates and returns
    // one document; an array creates and returns an array (the form used
    // with { session } inside transactions).
    async create(data: T | T[], options?: unknown): Promise<T | T[]> {
      const items = Array.isArray(data) ? data : [data];
      const created = items.map((d) => structuredClone(d));
      docs.push(...created);
      extractSession(options)?.recordUndo(() => {
        for (const c of created) {
          const idx = docs.findIndex((d) => d._id === c._id);
          if (idx !== -1) docs.splice(idx, 1);
        }
      });
      return Array.isArray(data) ? created.map((d) => structuredClone(d)) : structuredClone(created[0]);
    },
  };
}

/**
 * A fake mongoose session whose withTransaction runs the callback and, on
 * failure, replays every mutation's recorded undo action in reverse
 * order — see the module doc comment above for why this is a per-mutation
 * undo log rather than a whole-collection snapshot restore.
 */
export function createFakeSession(): FakeSession {
  const undoLog: Array<() => void> = [];
  return {
    recordUndo(fn: () => void) {
      undoLog.push(fn);
    },
    async withTransaction(fn: () => Promise<void>): Promise<void> {
      try {
        await fn();
      } catch (err) {
        for (let i = undoLog.length - 1; i >= 0; i--) {
          undoLog[i]();
        }
        throw err;
      }
    },
    async endSession(): Promise<void> {},
  };
}
