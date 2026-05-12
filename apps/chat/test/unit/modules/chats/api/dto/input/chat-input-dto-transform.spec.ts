import { plainToInstance } from 'class-transformer';
import { SendMessageInputDto } from '@chat/modules/chats/api/dto/input/send-message.input.dto';
import { SendMediaMessageInputDto } from '@chat/modules/chats/api/dto/input/send-media-message.input.dto';

describe('Chat input DTO transforms', () => {
  it('trims text message content before validation and command handling', () => {
    const dto = plainToInstance(SendMessageInputDto, {
      recipientId: 12,
      message: '  hello from postman  ',
    });

    expect(dto.message).toBe('hello from postman');
  });

  it('trims optional media text while preserving numeric metadata transforms', () => {
    const dto = plainToInstance(SendMediaMessageInputDto, {
      recipientId: '12',
      type: 'IMAGE',
      text: '  look at this  ',
      width: '1080',
      height: '720',
    });

    expect(dto.text).toBe('look at this');
    expect(dto.recipientId).toBe(12);
    expect(dto.width).toBe(1080);
    expect(dto.height).toBe(720);
  });
});
