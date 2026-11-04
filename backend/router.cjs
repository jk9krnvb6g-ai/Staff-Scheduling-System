'use strict';

/**
 * Staff Scheduling Gateway module.
 * Export an Express Router only: the Central API Gateway owns port 3002.
 * Do not add app.listen(), server.listen(), or a separate HTTP server here.
 */
const express = require('express');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    service: 'staff-scheduling',
    environment: 'staging',
    status: 'ready-for-integration',
    database: 'not-connected',
    authentication: 'not-configured'
  });
});

// Fail closed until the database, authentication and scoped RBAC are implemented.
// Never return mock staff, schedule, or personal information from staging APIs.
router.use((_req, res) => {
  res.status(503).json({
    error: 'STAFF_SCHEDULING_NOT_READY',
    message: 'Staff Scheduling staging APIs are not enabled yet'
  });
});

module.exports = router;
