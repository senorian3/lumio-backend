import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RefreshTokenGuard } from '@lumio/core/guards/refresh/refresh-token.guard';
import { SessionsController } from '@lumio/modules/sessions/api/sessions.controller';
import { OutputSessionType } from '@lumio/modules/sessions/api/dto/output/output';
import { GetAllSessionsCommand } from '@lumio/modules/sessions/application/use-cases/get-all-sessions.usecase';
import { DeleteSessionCommand } from '@lumio/modules/sessions/application/use-cases/delete-session.usecase';
import { DeleteAllSessionsCommand } from '@lumio/modules/sessions/application/use-cases/delete-all-sessions.usecase';

describe('SessionsController', () => {
  let controller: SessionsController;
  let mockCommandBus: CommandBus;
  let mockQueryBus: QueryBus;

  const mockRequest = {
    user: {
      userId: 1,
      deviceId: 'device-123',
    },
  };
  const mockSessions: OutputSessionType[] = [
    new OutputSessionType(
      'Chrome on Windows',
      '192.168.1.1',
      '2025-01-01T10:00:00.000Z',
    ),
    new OutputSessionType(
      'Safari on Mac',
      '192.168.1.2',
      '2025-01-02T10:00:00.000Z',
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
      .overrideGuard(RefreshTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SessionsController>(SessionsController);
    mockCommandBus = module.get<CommandBus>(CommandBus);
    mockQueryBus = module.get<QueryBus>(QueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllSessions', () => {
    it('should return all sessions for authenticated user', async () => {
      // Arrange
      (mockQueryBus.execute as jest.Mock).mockResolvedValue(mockSessions);

      // Act
      const result = await controller.getAllSessions(mockRequest);

      // Assert
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetAllSessionsCommand(mockRequest.user.userId),
      );
      expect(result).toEqual(mockSessions);
    });
  });

  describe('deleteSession', () => {
    it('should delete specific session by deviceId', async () => {
      // Arrange
      const deviceId = 'device-456';
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.deleteSession(mockRequest, deviceId);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new DeleteSessionCommand({
          userId: mockRequest.user.userId,
          userDeviceId: mockRequest.user.deviceId,
          paramDeviceId: deviceId,
        }),
      );
    });
  });

  describe('deleteAllSessions', () => {
    it('should delete all sessions except current', async () => {
      // Arrange
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.deleteAllSessions(mockRequest);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new DeleteAllSessionsCommand({
          userId: mockRequest.user.userId,
          deviceId: mockRequest.user.deviceId,
        }),
      );
    });
  });
});
