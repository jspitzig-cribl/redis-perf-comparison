import { RedisDocker } from "./docker/redisDocker";
import { RedisExecutor, RedisTest } from "./test/base";
import { NewRedis } from "./test/newRedis";
import { OldRedis } from "./test/oldRedis";
import { getOrSet, time } from "./utils";
import * as hdr from 'hdr-histogram-js';
import { AppArgs } from "./args/args";
hdr.initWebAssemblySync();

type TestResult = {[test:string]:{
    stats:any,
    overall:number
  }
}
type ExecutorResults = {[executor:string]: TestResult[]};

export class App {
  constructor(private args:AppArgs) {}
  public async run(tests:RedisTest[]):Promise<void> {
    const executors:RedisExecutor[] = [
      OldRedis.instance,
      NewRedis.instance
    ];
    let includedTests:RedisTest[];
    if(this.args.testName && this.args.testName != '@all') {
      includedTests = tests.filter(t => t.name === this.args.testName);
    } else {
      includedTests = tests;
    }
    const allTestResults:ExecutorResults = {};
    try {
      for(let i = 0; i < this.args.runs; i++) {
        console.log(`Run ${i}`);
        for(const executor of executors) {
          // Make sure we recreate the redis instance each time to avoid "warming up" favoritism
          console.log('Starting Redis docker instance');
          await RedisDocker.instance.start();
          console.log('Connecting executor');
          await executor.connect({host: 'localhost', port: 6379});
          console.log('Starting tests');
          const testResults = await this.runTests(executor, includedTests);
          console.log('Collecting results');
          const executorResults = getOrSet(allTestResults, executor.name, () => []);
          executorResults.push(testResults);
          console.log('Closing connection');
          await executor.close();
          console.log('Stopping Redis docker instance');
          await RedisDocker.instance.stop();
        }
      }
      this.displayResults(allTestResults);
    } catch(error) {
      console.log('An error occurred');
      console.error(error);
    } finally {
      console.log('Closing redis connections');
      await Promise.all(executors.map(e => e.cleanup()));
    }
  }

  private async runTests(executor:RedisExecutor, tests:RedisTest[]):Promise<TestResult> {
    const results:TestResult = {};
    for(const test of tests) {
      console.log(`Running test - ${test.name} - ${executor.name}`)
      const histogram = hdr.build({ useWebAssembly: true });
      await executor.setupTest(test);
      const [overall, _] = await time(async () => {
        for(let i = 0; i < this.args.count; i++) {
          const [duration, _] = await time(async () => await executor.executeTest(test));
          histogram.recordValue(Number(duration));
        }
      })
      await executor.cleanupTest(test);
      results[test.name] = {stats:histogram, overall:Number(overall)};
    }
    return results;
  }

  private displayResults(executorResults:ExecutorResults):void {
    console.log('\nResults');
    const testOutputs:any = {}
    for(const [executorName, executorResult] of Object.entries(executorResults)) {
      for(const testResults of executorResult) {
        for(const [testName, testResult] of Object.entries(testResults)) {
          const executorOutputs = getOrSet(testOutputs, testName, () => ({}));
          const executorTestOutput = getOrSet(executorOutputs, executorName, () => ({ operationsPerSecond: [], p0: [], p50: [], p95: [], p99: [], p100: [] }));
          const ops = Math.round(this.args.count / testResult.overall * 1_000_000_000);
          const p0 = testResult.stats.getValueAtPercentile(0);
          const p50 = testResult.stats.getValueAtPercentile(50);
          const p95 = testResult.stats.getValueAtPercentile(95);
          const p99 = testResult.stats.getValueAtPercentile(99);
          const p100 = testResult.stats.getValueAtPercentile(100);
          executorTestOutput.operationsPerSecond.push(ops);
          executorTestOutput.operationsPerSecond.avg = (executorTestOutput.operationsPerSecond.avg ?? 0) + ops;
          executorTestOutput.p0.push(p0);
          executorTestOutput.p0.avg = (executorTestOutput.p0.avg ?? 0) + p0;
          executorTestOutput.p50.push(p50);
          executorTestOutput.p50.avg = (executorTestOutput.p50.avg ?? 0) + p50;
          executorTestOutput.p95.push(p95);
          executorTestOutput.p95.avg = (executorTestOutput.p95.avg ?? 0) + p95;
          executorTestOutput.p99.push(p99);
          executorTestOutput.p99.avg = (executorTestOutput.p99.avg ?? 0) + p99;
          executorTestOutput.p100.push(p100);
          executorTestOutput.p100.avg = (executorTestOutput.p100.avg ?? 0) + p100;
        }
      }
    }
    for(const [testName, testOutput] of Object.entries(testOutputs as any)) {
      console.log(`\n\n[[${testName}]]:`);
      for(const [executorName, executorOutput] of Object.entries(testOutput as any)) {
        const __executorOutput = executorOutput as any;
        __executorOutput.operationsPerSecond.avg = Math.round(__executorOutput.operationsPerSecond.avg / this.args.runs);
        __executorOutput.p0.avg = Math.round(__executorOutput.p0.avg / this.args.runs);
        __executorOutput.p50.avg = Math.round(__executorOutput.p50.avg / this.args.runs);
        __executorOutput.p95.avg = Math.round(__executorOutput.p95.avg / this.args.runs);
        __executorOutput.p99.avg = Math.round(__executorOutput.p99.avg / this.args.runs);
        __executorOutput.p100.avg = Math.round(__executorOutput.p100.avg / this.args.runs);
        console.log(`[[${executorName}]]:`);
        console.table(executorOutput);
      }
    }
  }
}