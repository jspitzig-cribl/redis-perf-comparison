import { rejects } from "assert";
import { RedisConfiguration, RedisExecutor, RedisInstruction, RedisTest } from "./base";
const Redis = require('oldRedis');

export class OldRedis implements RedisExecutor {
  private client?:any
  static readonly instance = new OldRedis();
  private constructor() {}
  get name():string {
    return 'redis 3.1.2';
  }
  async connect(config: RedisConfiguration): Promise<void> {
    this.client = Redis.createClient({
      url:`redis://${config.host}:${config.port}`
    });
    return new Promise((resolve, reject) => {
      this.client!.on('error', (error:any) => reject(error));
      this.client!.on('connect', () => resolve());
    });
  }
  async setupTest(test: RedisTest): Promise<any> {
    if(!test.setupInstructions) return Promise.resolve();
    return this.executeInstructions(test.setupInstructions);
  }
  async executeTest(test: RedisTest): Promise<any[]> {
    return this.executeInstructions(test.instructions);
  }
  async cleanupTest(test: RedisTest): Promise<any> {
    if(!test.cleanupInstructions) return Promise.resolve();
    return this.executeInstructions(test.cleanupInstructions);
  }
  async executeInstructions(instructions:RedisInstruction[]):Promise<any[]> {
    if(!this.client) return [];
    let pipeline = this.client.batch();
    for(const instruction of instructions) {
      pipeline = pipeline[instruction.command](...instruction.arguments.map(a => a.toString()));
    }
    return new Promise((resolve, reject) => {
      pipeline.exec((error:any, results: any[]) => {
        if(error) reject(error);
        else resolve(results);
      })
    });
  }
  async close():Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client?.quit((error:any) => {
          if(error) rejects(error);
          else resolve();    
        });
      } catch(error) {
        reject(error);
      }
    });
}
  async cleanup(): Promise<void> {
    await this.close();
  }
}