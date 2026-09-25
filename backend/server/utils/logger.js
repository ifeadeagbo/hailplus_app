const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  writeToFile(level, message, data = null) {
    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(this.logDir, `${date}.log`);
    
    const logEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      ...(data && { data })
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(filename, logLine, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }

  info(message, data) {
    console.log(`[INFO] ${this.getTimestamp()} - ${message}`);
    this.writeToFile('INFO', message, data);
  }

  error(message, error) {
    console.error(`[ERROR] ${this.getTimestamp()} - ${message}`);
    this.writeToFile('ERROR', message, {
      error: error.message,
      stack: error.stack
    });
  }

  warn(message, data) {
    console.warn(`[WARN] ${this.getTimestamp()} - ${message}`);
    this.writeToFile('WARN', message, data);
  }

  debug(message, data) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${this.getTimestamp()} - ${message}`);
      this.writeToFile('DEBUG', message, data);
    }
  }

  http(req) {
    const log = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    this.info(`HTTP ${req.method} ${req.url}`, log);
  }
}

module.exports = new Logger();