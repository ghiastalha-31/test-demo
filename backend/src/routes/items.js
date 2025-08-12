const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');
const { itemSchema } = require('../middleware/itemsValidation')

// Utility to read data (intentionally sync to highlight blocking issue)
const readData = async () => {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
};
// Utility to write data
const writeData = async (data) => {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { limit, q } = req.query;
    let results = data;

    if (q) {
      // Simple substring search (sub‑optimal)
      results = results.filter(item => item.name.toLowerCase().includes(q.toLowerCase()));
    }

    if (limit) {
      results = results.slice(0, parseInt(limit));
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    // we can add a check to make sure that query params is a number or not
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = itemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const data = await readData();
    const newItem = { ...value, id: Date.now() };

    data.push(newItem);
    await writeData(data)
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

module.exports = router;