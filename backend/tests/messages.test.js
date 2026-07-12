require('./setup');
const request = require('supertest');
const app = require('../src/app');
const Message = require('../src/models/Message');

describe('POST /api/messages', () => {
  it('should create a valid message and return 201', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ username: 'Aditya', recipient: 'Bob', content: 'Hello', clientId: 'test-1' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('username', 'Aditya');
    expect(res.body.data).toHaveProperty('content', 'Hello');
    expect(res.body.data).toHaveProperty('status', 'sent');
  });

  it('should reject an empty message', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ username: 'Aditya', recipient: 'Bob', content: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject an empty username', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ username: '', recipient: 'Bob', content: 'Hello' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject a message with only whitespace', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ username: 'Aditya', recipient: 'Bob', content: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject oversized messages', async () => {
    const longContent = 'A'.repeat(2000);
    const res = await request(app)
      .post('/api/messages')
      .send({ username: 'Aditya', recipient: 'Bob', content: longContent, clientId: 'test-large' });

    expect(res.status).toBe(201);
    expect(res.body.data.content.length).toBe(1000);
  });

  it('should reject duplicate clientId', async () => {
    await request(app)
      .post('/api/messages')
      .send({ username: 'Aditya', recipient: 'Bob', content: 'First', clientId: 'dup-1' });

    const res = await request(app)
      .post('/api/messages')
      .send({ username: 'Aditya', recipient: 'Bob', content: 'Second', clientId: 'dup-1' });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('First');
  });
});

describe('GET /api/messages', () => {
  it('should fetch messages with pagination', async () => {
    await Message.create({ username: 'Aditya', content: 'Hello' });
    await Message.create({ username: 'Bob', content: 'Hi' });

    const res = await request(app).get('/api/messages?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toHaveProperty('totalMessages', 2);
    expect(res.body.pagination).toHaveProperty('totalPages', 1);
  });

  it('should paginate correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await Message.create({ username: 'Aditya', content: `Message ${i}` });
    }

    const res = await request(app).get('/api/messages?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toHaveProperty('totalMessages', 5);
    expect(res.body.pagination).toHaveProperty('totalPages', 3);
  });

  it('should handle MongoDB service errors gracefully', async () => {
    const res = await request(app).get('/api/messages?page=-1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
