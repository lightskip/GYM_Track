/* ============================================================
   db.js — IndexedDB wrapper (Promise-based)
   ============================================================ */

const DB_NAME    = 'gymtrack';
const DB_VERSION = 1;

let _db = null;

const DB = {
  open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;

        // Workouts store
        if (!db.objectStoreNames.contains('workouts')) {
          const ws = db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
          ws.createIndex('date', 'date', { unique: false });
        }

        // Templates store
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id', autoIncrement: true });
        }

        // Exercises store
        if (!db.objectStoreNames.contains('exercises')) {
          const es = db.createObjectStore('exercises', { keyPath: 'id', autoIncrement: true });
          es.createIndex('name', 'name', { unique: false });
          es.createIndex('muscle', 'muscle', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      req.onsuccess = e => { _db = e.target.result; resolve(_db); };
      req.onerror   = e => reject(e.target.error);
    });
  },

  // Generic helpers
  _tx(store, mode) {
    return _db.transaction(store, mode).objectStore(store);
  },

  getAll(store) {
    return this.open().then(() => new Promise((resolve, reject) => {
      const req = this._tx(store, 'readonly').getAll();
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    }));
  },

  get(store, key) {
    return this.open().then(() => new Promise((resolve, reject) => {
      const req = this._tx(store, 'readonly').get(key);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    }));
  },

  put(store, value) {
    return this.open().then(() => new Promise((resolve, reject) => {
      const req = this._tx(store, 'readwrite').put(value);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    }));
  },

  add(store, value) {
    return this.open().then(() => new Promise((resolve, reject) => {
      const req = this._tx(store, 'readwrite').add(value);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    }));
  },

  delete(store, key) {
    return this.open().then(() => new Promise((resolve, reject) => {
      const req = this._tx(store, 'readwrite').delete(key);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    }));
  },

  clear(store) {
    return this.open().then(() => new Promise((resolve, reject) => {
      const req = this._tx(store, 'readwrite').clear();
      req.onsuccess = e => resolve();
      req.onerror   = e => reject(e.target.error);
    }));
  },

  // Settings helpers
  getSetting(key, defaultVal) {
    return this.get('settings', key).then(r => r ? r.value : defaultVal);
  },

  setSetting(key, value) {
    return this.put('settings', { key, value });
  },

  // Export all data
  exportAll() {
    return Promise.all([
      this.getAll('workouts'),
      this.getAll('templates'),
      this.getAll('exercises'),
      this.getAll('settings'),
    ]).then(([workouts, templates, exercises, settings]) => ({
      version: 1,
      exportedAt: new Date().toISOString(),
      workouts, templates, exercises, settings
    }));
  },

  // Import all data (replaces existing)
  async importAll(data) {
    await this.open();
    const stores = ['workouts', 'templates', 'exercises', 'settings'];
    for (const store of stores) {
      await this.clear(store);
      const items = data[store] || [];
      for (const item of items) {
        await this.put(store, item);
      }
    }
  }
};
