import { LoggerService, Injectable } from '@nestjs/common';
import chalk from 'chalk';

@Injectable()
export class AppLoggerService implements LoggerService {
  private getTimestamp(): string {
    const now = new Date();
    return `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}, ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: string,
  ): string {
    const timestamp = this.getTimestamp();
    const pid = process.pid;
    const contextStr = context ? chalk.yellow(` [${context}]`) : '';

    const levelColors = {
      LOG: chalk.green,
      ERROR: chalk.red,
      WARN: chalk.yellow,
      DEBUG: chalk.blue,
      VERBOSE: chalk.magenta,
    } as const;

    const levelColor =
      levelColors[level as keyof typeof levelColors] || chalk.white;
    const levelText = levelColor('[LOGGER]');

    return `${levelText} ${chalk.green(pid)}  - ${chalk.white(timestamp)}     ${levelColor(level)}${contextStr} ${levelColor(message)}`;
  }

  log(message: string, context?: string) {
    console.log(this.formatMessage('LOG', message, context));
  }

  error(message: string, trace?: string, context?: string) {
    console.error(this.formatMessage('ERROR', message, context));
    if (trace) console.error(chalk.red(trace));
  }

  warn(message: string, context?: string) {
    console.warn(this.formatMessage('WARN', message, context));
  }

  debug(message: string, context?: string) {
    console.debug(this.formatMessage('DEBUG', message, context));
  }

  verbose(message: string, context?: string) {
    console.log(this.formatMessage('VERBOSE', message, context));
  }
}
