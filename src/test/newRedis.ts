import { RedisConfiguration, RedisExecutor, RedisInstruction, RedisTest } from "./base";
import * as Redis from 'redis';

export class NewRedis implements RedisExecutor {
  private client?:any
  static readonly instance = new NewRedis();
  private constructor() {}
  get name():string {
    return 'redis 4.2.0';
  }
  async connect(config: RedisConfiguration): Promise<void> {
    this.client = Redis.createClient({
      url:`redis://${config.host}:${config.port}`
    });
    await this.client!.connect();
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
    return Promise.all(instructions.map(i => this.client[i.command.toUpperCase()](...i.arguments)));
  }
  async close():Promise<void> {
    try {
      if(this.client?.isOpen ?? false) {
        await this.client?.quit();
      }
    } catch(e) {
      console.error(e);
    }
  }
  async cleanup(): Promise<void> {
    await this.close();
  }
}