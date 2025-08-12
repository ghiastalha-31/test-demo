const request = require('supertest');
const express = require('express');
const itemsRouter = require('../src/routes/items'); // adjust path
const fs = require('fs').promises;
const path = require('path');

const DATA_PATH = path.join(__dirname, '../../data/items.json');

let app;

beforeAll(async () => {
  // Create a fresh Express app for testing
  app = express();
  app.use(express.json());
  app.use('/api/items', itemsRouter);

  // Seed a known items.json for predictable tests
  const seedData = [
    { id: 1, name: 'Apple', category: 'Food', price: 10 },
    { id: 2, name: 'Banana', category: 'Food', price: 5 }
  ];
  await fs.writeFile(DATA_PATH, JSON.stringify(seedData, null, 2));
});

describe('GET /api/items', () => {
  it('should return all items', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('name', 'Apple');
  });

  it('should filter items by given query parameter and that is ban', async () => {
    const res = await request(app).get('/api/items?q=ban');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('name', 'Banana');
  });

  it('should limit items if limit param is provided', async () => {
    const res = await request(app).get('/api/items?limit=1');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe('GET /api/items/:id', () => {
  it('should return a single item if found', async () => {
    const res = await request(app).get('/api/items/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Apple');
  });

  it('should return 404 if item not found there is no item with id 999', async () => {
    const res = await request(app).get('/api/items/999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/items', () => {
   it('should create a new item', async () => {
    const newItem = { name: 'Orange', price: 8, category: 'Food' };
    const res = await request(app).post('/api/items').send(newItem);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'Orange');

    // Confirm it's in the file now
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const data = JSON.parse(raw);
    expect(data.some(item => item.name === 'Orange')).toBe(true);
  });

  it('should return 400 for invalid payload as the validation has been aded.', async () => {
    const res = await request(app).post('/api/items').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error'); // or whatever your API returns
  });
});
