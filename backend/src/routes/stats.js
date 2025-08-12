const express = require('express');
const fs = require('fs').promises;
const fssync = require('fs'); // for watch only as this is not with async
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');



let cachedStats = null;
let lastModifiedTime = null;



/**
 * Calculates summary statistics for a list of items.
 * 
 * Note: This is synchronous and CPU-bound.
 * For very large arrays (e.g., millions of items), this can block the event loop.
 * In that case, consider caching results, using worker threads, or streaming the calculation.
 */
function calculateStats(items) {
  return {
    total: items.length,
    averagePrice: items.length
      ? items.reduce((acc, cur) => acc + cur.price, 0) / items.length
      : 0
  };
}


/**
 * Loads item data from disk, parses it, and updates the cached stats.
 * 
 * - Reads the items.json file asynchronously (non-blocking I/O).
 * - Parses JSON into a JavaScript array.
 * - Calls calculateStats() function to compute summary statistics.
 * - Updates global cache variables (cachedStats and lastModifiedTime).
 * 
 * This function is typically called:
 *   - On server startup (initial load).
 *   - Whenever the items.json file changes (via fs.watch or similar).
 * 
 * Errors are logged but not thrown, so the application continues running.
 */
async function loadStats() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const items = JSON.parse(raw);
    cachedStats = calculateStats(items);
    lastModifiedTime = Date.now();
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}


// Watch file for changes
fssync.watch(DATA_PATH, (eventType) => {
  if (eventType === 'change') {
    console.log('items.json file has been changed — refreshing cache...');
    loadStats();
  }
});

// Initial load
loadStats();


// GET /api/stats
router.get('/', (req, res) => {
  if (!cachedStats) {
    return res.status(503).json({ error: 'Stats not available yet.' });
  }
  res.json({
    ...cachedStats,
    lastUpdated: new Date(lastModifiedTime).toISOString()
  });
});

module.exports = router;