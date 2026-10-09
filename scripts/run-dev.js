const { spawn } = require('node:child_process');
const net = require('node:net');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function main() {
  const backendPort = await getFreePort();
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  const frontend = spawn(npmCommand, ['--prefix', 'frontend', 'run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, BACKEND_PORT: String(backendPort) },
  });

  const backend = spawn(npmCommand, ['--prefix', 'server', 'run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, BACKEND_PORT: String(backendPort) },
  });

  const handleExit = (code, signal) => {
    if (frontend.exitCode !== null) frontend.kill();
    if (backend.exitCode !== null) backend.kill();
    if (code !== 0) process.exit(code ?? 1);
    if (signal) process.exit(1);
  };

  frontend.on('exit', handleExit);
  backend.on('exit', handleExit);
}

main().catch((error) => {
  console.error('Failed to start development servers:', error);
  process.exit(1);
});
