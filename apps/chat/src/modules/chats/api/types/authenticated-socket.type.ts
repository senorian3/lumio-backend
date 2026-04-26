import { Socket } from 'socket.io';

export type AuthenticatedSocket = Socket & {
  data: Socket['data'] & {
    userId?: number;
  };
};
