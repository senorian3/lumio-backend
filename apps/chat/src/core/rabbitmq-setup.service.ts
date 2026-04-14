import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { CoreConfig } from './core.config';

@Injectable()
export class RabbitMQSetupService implements OnModuleInit, OnModuleDestroy {
  private client: ClientProxy;

  constructor(private readonly coreConfig: CoreConfig) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.coreConfig.rabbitmqUrl],
        queue: this.coreConfig.rabbitmqQueue,
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  getClient(): ClientProxy {
    return this.client;
  }

  async emit(pattern: string, data: any): Promise<void> {
    await this.client.emit(pattern, data).toPromise();
  }

  async send(pattern: string, data: any): Promise<any> {
    return await this.client.send(pattern, data).toPromise();
  }
}
