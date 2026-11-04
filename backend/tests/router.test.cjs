'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const router = require('../router.cjs');

test('exports an Express router, not a listener', () => {
  assert.equal(typeof router, 'function');
  assert.equal(typeof router.listen, 'undefined');
});

test('staging health endpoint is explicitly non-production-ready', async () => {
  const app = express();
  app.use('/api/Staff-Scheduling-Test', router);
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/Staff-Scheduling-Test/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.database, 'not-connected');
    assert.equal(body.authentication, 'not-configured');
    const protectedResponse = await fetch(`http://127.0.0.1:${address.port}/api/Staff-Scheduling-Test/activities`);
    assert.equal(protectedResponse.status, 503);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
