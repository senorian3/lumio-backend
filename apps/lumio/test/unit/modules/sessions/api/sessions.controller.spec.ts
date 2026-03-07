import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from '@lumio/modules/sessions/api/sessions.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RefreshTokenGuard } from '@lumio/core/guards/refresh/refresh-token.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { OutputSessionDto } from '@lumio/modules/sessions/api/dto/output/session.output.dto';

describe('SessionsController', () => {
  let sessionsController: SessionsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockSessions: OutputSessionDto[] = [
    new OutputSessionDto(
      'Chrome on Windows',
      '192.168.1.1',
      '2024-01-15T10:30:00.000Z',
    ),
    new OutputSessionDto(
      'Safari on Mac',
      '192.168.1.2',
      '2024-01-14T15:45:00.000Z',
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RefreshTokenGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    sessionsController = module.get<SessionsController>(SessionsController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('getAllSessions', () => {
    it('should return all user sessions', async () => {
      const userId = 1;
      queryBus.execute.mockResolvedValue(mockSessions);

      const result = await sessionsController.getAllSessions(userId);

      expect(result).toEqual(mockSessions);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
      );
    });

    it('should return empty array when user has no sessions', async () => {
      const userId = 2;
      queryBus.execute.mockResolvedValue([]);

      const result = await sessionsController.getAllSessions(userId);

      expect(result).toEqual([]);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete specific session by deviceId', async () => {
      const userId = 1;
      const userDeviceId = 'current-device-123';
      const paramDeviceId = 'device-to-delete-456';

      commandBus.execute.mockResolvedValue(undefined);

      await sessionsController.deleteSession(
        userId,
        userDeviceId,
        paramDeviceId,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          deleteSessionDto: expect.objectContaining({
            userId,
            userDeviceId,
            paramDeviceId,
          }),
        }),
      );
    });

    it('should handle deletion of current session', async () => {
      const userId = 1;
      const userDeviceId = 'current-device-123';
      const paramDeviceId = 'current-device-123'; // Same as current device

      commandBus.execute.mockResolvedValue(undefined);

      await sessionsController.deleteSession(
        userId,
        userDeviceId,
        paramDeviceId,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          deleteSessionDto: expect.objectContaining({
            userId,
            userDeviceId,
            paramDeviceId,
          }),
        }),
      );
    });
  });

  describe('deleteAllSessions', () => {
    it('should delete all sessions except current', async () => {
      const userId = 1;
      const deviceId = 'current-device-123';

      commandBus.execute.mockResolvedValue(undefined);

      await sessionsController.deleteAllSessions(userId, deviceId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          deleteAllSessionsDto: expect.objectContaining({
            userId,
            deviceId,
          }),
        }),
      );
    });

    it('should handle when user has only one session', async () => {
      const userId = 2;
      const deviceId = 'only-device-789';

      commandBus.execute.mockResolvedValue(undefined);

      await sessionsController.deleteAllSessions(userId, deviceId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          deleteAllSessionsDto: expect.objectContaining({
            userId,
            deviceId,
          }),
        }),
      );
    });
  });
});
