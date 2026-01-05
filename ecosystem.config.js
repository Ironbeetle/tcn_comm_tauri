module.exports = {
  apps: [
    {
      name: 'tcn-comm',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/tcn-comm',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/tcn-comm-error.log',
      out_file: '/var/log/pm2/tcn-comm-out.log',
      log_file: '/var/log/pm2/tcn-comm-combined.log',
      time: true
    }
  ]
}
