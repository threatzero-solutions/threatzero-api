import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import { TrainingReminderTasks } from './training-reminder.tasks';
import { CourseEnrollment } from '../../organizations/organizations/entities/course-enrollment.entity';
import { ItemCompletion } from '../items/entities/item-completion.entity';
import { KeycloakAdminClientService } from '../../auth/keycloak-admin-client/keycloak-admin-client.service';
import { OpaqueTokenService } from '../../auth/opaque-token.service';

describe('TrainingReminderTasks', () => {
  let service: TrainingReminderTasks;
  let enrollmentsRepo: Repository<CourseEnrollment>;
  let completionsRepo: Repository<ItemCompletion>;
  let keycloakService: KeycloakAdminClientService;
  let opaqueTokenService: OpaqueTokenService;
  let notificationsQueue: Queue;

  const mockEnrollment = {
    id: 'enrollment-1',
    startDate: dayjs().subtract(1, 'week').toDate(),
    endDate: dayjs().add(1, 'month').toDate(),
    organization: {
      id: 'org-1',
      slug: 'test-org',
    },
    course: {
      id: 'course-1',
      sections: [
        {
          id: 'section-1',
          order: 1,
          duration: 'P7D', // 7 days
          items: [
            {
              item: {
                id: 'item-1',
                metadata: {
                  title: 'Test Training',
                  description: 'Test Description',
                },
                thumbnailUrl: 'https://example.com/thumb.jpg',
              },
            },
          ],
        },
      ],
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    attributes: {
      unit: ['unit-1'],
      audience: ['audience-1'],
      organization: 'test-org',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingReminderTasks,
        {
          provide: getRepositoryToken(CourseEnrollment),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockEnrollment]),
            }),
          },
        },
        {
          provide: getRepositoryToken(ItemCompletion),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: 'BullQueue_notifications',
          useValue: {
            add: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                'keycloak.parentRoleGroupsGroupId': 'parent-group-id',
                'general.appHost': 'https://app.example.com',
                'notifications.email.templates.trainingReminder':
                  'reminder-template',
              };
              return config[key];
            }),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                'keycloak.parentRoleGroupsGroupId': 'parent-group-id',
                'general.appHost': 'https://app.example.com',
                'notifications.email.templates.trainingReminder':
                  'reminder-template',
              };
              return config[key];
            }),
          },
        },
        {
          provide: KeycloakAdminClientService,
          useValue: {
            findGroup: jest.fn().mockResolvedValue({ id: 'training-group-id' }),
            findUsersByAttribute: jest.fn().mockResolvedValue({
              results: [mockUser],
            }),
          },
        },
        {
          provide: OpaqueTokenService,
          useValue: {
            create: jest.fn().mockResolvedValue({ key: 'opaque-token-123' }),
          },
        },
      ],
    }).compile();

    service = module.get<TrainingReminderTasks>(TrainingReminderTasks);
    enrollmentsRepo = module.get(getRepositoryToken(CourseEnrollment));
    completionsRepo = module.get(getRepositoryToken(ItemCompletion));
    keycloakService = module.get(KeycloakAdminClientService);
    opaqueTokenService = module.get(OpaqueTokenService);
    notificationsQueue = module.get('BullQueue_notifications');

    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleReminders', () => {
    it('should process active enrollments and send initial reminders', async () => {
      const today = dayjs().startOf('day');
      const mockEnrollmentWithTodayStart = {
        ...mockEnrollment,
        startDate: today.toDate(),
      };

      jest.spyOn(enrollmentsRepo, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEnrollmentWithTodayStart]),
      } as any);

      await service.handleReminders();

      expect(enrollmentsRepo.createQueryBuilder).toHaveBeenCalled();
      expect(keycloakService.findUsersByAttribute).toHaveBeenCalled();
      expect(opaqueTokenService.create).toHaveBeenCalled();
      expect(notificationsQueue.add).toHaveBeenCalled();
    });

    it('should send follow-up reminders for incomplete items', async () => {
      const today = dayjs().startOf('day');
      const mockEnrollmentWithPastStart = {
        ...mockEnrollment,
        startDate: today.subtract(14, 'days').toDate(),
      };

      jest.spyOn(enrollmentsRepo, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEnrollmentWithPastStart]),
      } as any);

      jest.spyOn(completionsRepo, 'find').mockResolvedValue([]);

      await service.handleReminders();

      expect(completionsRepo.find).toHaveBeenCalled();
      expect(notificationsQueue.add).toHaveBeenCalled();
    });

    it('should skip enrollments without course sections', async () => {
      const mockEnrollmentNoSections = {
        ...mockEnrollment,
        course: { id: 'course-1', sections: [] },
      };

      jest.spyOn(enrollmentsRepo, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEnrollmentNoSections]),
      } as any);

      await service.handleReminders();

      expect(notificationsQueue.add).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(enrollmentsRepo, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      await expect(service.handleReminders()).resolves.not.toThrow();
    });
  });

  describe('firstWeekday', () => {
    it('should return Monday for Sunday', () => {
      const sunday = dayjs('2024-01-07'); // Sunday
      const result = service['firstWeekday'](sunday);
      expect(result.day()).toBe(1); // Monday
    });

    it('should return Monday for Saturday', () => {
      const saturday = dayjs('2024-01-06'); // Saturday
      const result = service['firstWeekday'](saturday);
      expect(result.day()).toBe(1); // Monday
    });

    it('should return the same day for weekdays', () => {
      const tuesday = dayjs('2024-01-09'); // Tuesday
      const result = service['firstWeekday'](tuesday);
      expect(result.day()).toBe(2); // Tuesday
    });
  });

  describe('sendReminderEmail', () => {
    it('should not send email if user has no email', async () => {
      const userNoEmail = { ...mockUser, email: undefined };

      await service['sendReminderEmail']({
        user: userNoEmail,
        enrollmentId: 'enrollment-1',
        organizationSlug: 'test-org',
        items: [mockEnrollment.course.sections[0].items[0].item as any],
        isInitialReminder: true,
      });

      expect(notificationsQueue.add).not.toHaveBeenCalled();
    });

    it('should not send email if no items provided', async () => {
      await service['sendReminderEmail']({
        user: mockUser,
        enrollmentId: 'enrollment-1',
        organizationSlug: 'test-org',
        items: [],
        isInitialReminder: true,
      });

      expect(notificationsQueue.add).not.toHaveBeenCalled();
    });

    it('should send email with correct template and context', async () => {
      const item = mockEnrollment.course.sections[0].items[0].item;

      await service['sendReminderEmail']({
        user: mockUser,
        enrollmentId: 'enrollment-1',
        organizationSlug: 'test-org',
        items: [item as any],
        isInitialReminder: true,
      });

      expect(opaqueTokenService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          organizationSlug: 'test-org',
          enrollmentId: 'enrollment-1',
          trainingItemId: item.id,
        }),
        expect.any(Object),
      );

      expect(notificationsQueue.add).toHaveBeenCalledWith(
        'SendEmailNotification',
        expect.objectContaining({
          to: [mockUser.email],
          templateName: 'reminder-template',
          context: expect.objectContaining({
            firstName: mockUser.firstName,
            isInitialReminder: true,
            plural: false,
            trainingContexts: expect.arrayContaining([
              expect.objectContaining({
                trainingTitle: item.metadata.title,
                trainingDescription: item.metadata.description,
                trainingLink: expect.stringContaining('opaque-token-123'),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('sendFollowupReminderEmails', () => {
    it('should skip users who completed all items', async () => {
      const item = mockEnrollment.course.sections[0].items[0].item;

      jest.spyOn(completionsRepo, 'find').mockResolvedValue([
        {
          userId: mockUser.id,
          item: { id: item.id },
        } as any,
      ]);

      await service['sendFollowupReminderEmails']('enrollment-1', 'test-org', [
        item as any,
      ]);

      expect(notificationsQueue.add).not.toHaveBeenCalled();
    });

    it('should send reminders for incomplete items only', async () => {
      const item1 = {
        ...mockEnrollment.course.sections[0].items[0].item,
        id: 'item-1',
      };
      const item2 = {
        ...mockEnrollment.course.sections[0].items[0].item,
        id: 'item-2',
      };

      jest.spyOn(completionsRepo, 'find').mockResolvedValue([
        {
          userId: mockUser.id,
          item: { id: 'item-1' },
        } as any,
      ]);

      await service['sendFollowupReminderEmails']('enrollment-1', 'test-org', [
        item1 as any,
        item2 as any,
      ]);

      expect(notificationsQueue.add).toHaveBeenCalledWith(
        'SendEmailNotification',
        expect.objectContaining({
          context: expect.objectContaining({
            isInitialReminder: false,
            trainingContexts: expect.arrayContaining([
              expect.objectContaining({
                trainingTitle: item2.metadata.title,
              }),
            ]),
          }),
        }),
      );
    });
  });
});
