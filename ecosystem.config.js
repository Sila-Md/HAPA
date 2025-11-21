module.exports = {
  apps: [{
    name: 'sila-md-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/bot-err.log',
    out_file: './logs/bot-out.log',
    log_file: './logs/bot-combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10
  }]
};