import { Prisma } from '@generated/prisma-chat';

export type ChatMessageWithAttachments = Prisma.MessageGetPayload<{
  include: { attachments: true };
}>;
