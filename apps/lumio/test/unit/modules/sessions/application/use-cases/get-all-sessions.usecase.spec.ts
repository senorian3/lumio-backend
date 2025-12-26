import { Test, TestingModule } from '@nestjs/testing';
import { QuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.query.repository';
import { OutputSessionDto } from '@lumio/modules/sessions/api/dto/output/session.output.dto';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  GetAllSessionsUseCase,
  GetAllSessionsCommand,
} from '@lumio/modules/sessions/application/use-cases/query/get-all-sessions.usecase';

describe('GetAllSessionsUseCase', () => {
  let useCase: GetAllSessionsUseCase;
  let mockRepository: QuerySessionsRepository;

  const mockSessions: SessionEntity[] = [
    {
      id: 1,
      deviceName: 'Chrome on Windows',
      ip: '192.168.1.1',
      userId: 1,
      createdAt: new Date('2025-01-01T10:00:00Z'),
      deletedAt: null,
      expiresAt: new Date('2025-07-01T10:00:00Z'),
      deviceId: 'device-123',
      tokenVersion: 1,
      user: {} as any,
    },
    {
      id: 2,
      deviceName: 'Safari on Mac',
      ip: '192.168.1.2',
      userId: 1,
      createdAt: new Date('2025-01-02T10:00:00Z'),
      deletedAt: null,
      expiresAt: new Date('2025-07-02T10:00:00Z'),
      deviceId: 'device-456',
      tokenVersion: 1,
      user: {} as any,
    },
  ];

  const expectedOutput: OutputSessionDto[] = [
    new OutputSessionDto(
      'Chrome on Windows',
      '192.168.1.1',
      '2025-01-01T10:00:00.000Z',
    ),
    new OutputSessionDto(
      'Safari on Mac',
      '192.168.1.2',
      '2025-01-02T10:00:00.000Z',
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllSessionsUseCase,
        {
          provide: QuerySessionsRepository,
          useValue: {
            getAllSessions: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetAllSessionsUseCase>(GetAllSessionsUseCase);
    mockRepository = module.get<QuerySessionsRepository>(
      QuerySessionsRepository,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return mapped sessions for given user id', async () => {
      // Arrange
      const userId = 1;
      const command = new GetAllSessionsCommand(userId);
      (mockRepository.getAllSessions as jest.Mock).mockResolvedValue(
        mockSessions,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockRepository.getAllSessions).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedOutput);
    });

    it('should throw BadRequestDomainException when repository returns null', async () => {
      // Arrange
      const userId = 999;
      const command = new GetAllSessionsCommand(userId);
      (mockRepository.getAllSessions as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        // Основное сообщение
        expect(domainException.message).toBe('Bad Request');
        // Конкретное сообщение в extensions
        expect(domainException.extensions[0]?.message).toBe(
          'Cant get all devices',
        );
      }
    });

    it('should throw BadRequestDomainException when repository returns undefined', async () => {
      // Arrange
      const userId = 999;
      const command = new GetAllSessionsCommand(userId);
      (mockRepository.getAllSessions as jest.Mock).mockResolvedValue(undefined);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.message).toBe('Bad Request');
        expect(domainException.extensions[0]?.message).toBe(
          'Cant get all devices',
        );
      }
    });

    it('should return empty array when user has no sessions', async () => {
      // Arrange
      const userId = 2;
      const command = new GetAllSessionsCommand(userId);
      (mockRepository.getAllSessions as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockRepository.getAllSessions).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });
  });
});
