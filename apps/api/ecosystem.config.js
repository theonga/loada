// Redirects to the monorepo-root ecosystem.config.js which manages all processes.
// Run from the repo root: pm2 start ecosystem.config.js --env production
module.exports = require("../../ecosystem.config.js");
