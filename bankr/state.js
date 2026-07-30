// State persistence helpers for Allele Bankr skill

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = '/tmp/allele_memory';

function ensureDir() {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

function save(key, data) {
  ensureDir();
  fs.writeFileSync(path.join(MEMORY_DIR, `${key}.json`), JSON.stringify(data, null, 2));
}

function load(key, defaultValue = null) {
  try {
    const file = path.join(MEMORY_DIR, `${key}.json`);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error(`Error loading ${key}:`, e.message);
  }
  return defaultValue;
}

function append(key, item) {
  const data = load(key, []);
  data.push({ ...item, timestamp: new Date().toISOString() });
  save(key, data);
}

module.exports = { save, load, append };
