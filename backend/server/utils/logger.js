// Logs go to stdout/stderr so the host (Docker, Render, Railway, etc.)
// collects them. Production writes one JSON object per line for log
// search tools; development writes readable lines; tests stay quiet.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const isProduction = process.env.NODE_ENV === 'production';
const defaultLevel = process.env.NODE_ENV === 'test' ? 'error' : (isProduction ? 'info' : 'debug');
const minLevel = LEVELS[process.env.LOG_LEVEL] || LEVELS[defaultLevel];

const serializeError = (error) =>
  error instanceof Error
    ? { error: error.message, stack: error.stack, ...(error.code && { code: error.code }) }
    : error;

const write = (level, message, data) => {
  if (LEVELS[level] < minLevel) return;
  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;

  if (isProduction) {
    stream.write(JSON.stringify({
      time: new Date().toISOString(),
      level,
      message,
      ...(data && (typeof data === 'object' ? data : { data }))
    }) + '\n');
  } else {
    const details = data ? ` ${JSON.stringify(data)}` : '';
    stream.write(`[${level.toUpperCase()}] ${new Date().toISOString()} - ${message}${details}\n`);
  }
};

module.exports = {
  debug: (message, data) => write('debug', message, data),
  info: (message, data) => write('info', message, data),
  warn: (message, data) => write('warn', message, data),
  error: (message, error) => write('error', message, error && serializeError(error))
};
