import Docker, { Container } from 'dockerode';
import { delay } from '../utils';


export class RedisDocker {
  private docker:Docker;
  private container?:Container;
  static readonly instance = new RedisDocker();
  private constructor() {
    this.docker = new Docker();
  }
  public async start():Promise<void> {
    const images = await this.docker.listImages();
    const isPulled = images.some(i => i.RepoTags?.includes('redis:6.2.5'));
    if(!isPulled) {
      const stream = await this.docker.pull('redis:6.2.5');
      await new Promise<void>((resolve, reject) => this.docker.modem.followProgress(stream, (error) => error ? reject(error) : resolve()));
    }
    this.container = await this.docker.createContainer({
      Image: 'redis:6.2.5',
      ExposedPorts: {
        '6379': {}
      },
      HostConfig: {
        PortBindings: {
          "6379": [{
            HostPort: "6379"
          }]
        }
      }
    });
    await this.container?.start();
    // Wait a bit to make sure redis is ready first
    await delay(5000);
  }
  public async stop():Promise<void> {
    try {
      const info = await (this.container?.inspect() ?? Promise.resolve(null));
      if(info?.State?.Running ?? false) {
        await this.container?.stop() ?? Promise.resolve();
      }
      await this.container?.remove() ?? Promise.resolve();
    } catch(error) {}
  }
}