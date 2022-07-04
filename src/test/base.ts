
export interface RedisInstruction {
  command: string,
  arguments: any[]
}
export interface RedisTest {
  name: string,
  setupInstructions?: RedisInstruction[],
  instructions: RedisInstruction[],
  cleanupInstructions?: RedisInstruction[],
}
export interface RedisConfiguration {
  host:string,
  port:number
}

export interface RedisExecutor {
  name:string
  connect(config:RedisConfiguration):Promise<void>
  setupTest(test:RedisTest):Promise<any>
  executeTest(test:RedisTest):Promise<any[]>
  cleanupTest(test:RedisTest):Promise<any>
  close():Promise<void>
  cleanup():Promise<void>
}