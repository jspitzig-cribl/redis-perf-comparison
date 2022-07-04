import yargs from 'yargs';
import {hideBin} from 'yargs/helpers'
const options = yargs(hideBin(process.argv)).options({
  'test-name': {
    type: 'string',
    default: '@all'
  }, 
  count: {
    type: 'number',
    default: 10000
  },
  runs: {
    type: 'number',
    default: 5
  }
});
export type AppArgs = ReturnType<typeof options.parseSync>;
export default options.parseSync();