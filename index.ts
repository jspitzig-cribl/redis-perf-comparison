import {App} from './src/app';
import tests from './data/tests.json';
import { RedisDocker } from './src/docker/redisDocker';
import args from './src/args/args';
const nodeCleanup = require('node-cleanup');

async function main() {
  const app = new App(args);
  try {
    await app.run(tests);
  } catch (error:any) {
    logError(error);
    console.log('Ensuring Redis docker instance is stopped');
    cleanup();
  }
}
function logError(error:any) {
  console.error('An error occurred during execution');
  console.error(error);
}
main().catch(error => logError(error));

nodeCleanup((_:any, signal:any):any => {
  if(signal) {
    console.log('Ensuring Redis docker instance is stopped');
    cleanup().then(() => {
      process.kill(process.pid, signal);
    });
    nodeCleanup.uninstall(); // don't call cleanup handler again
    return false;
  }
});

function cleanup() {
  return RedisDocker.instance.stop();
}