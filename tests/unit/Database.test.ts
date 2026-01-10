import { Database } from '../../src/database/Database';
import { User, Inquiry } from '../../src/types';

describe('Database', () => {
  let db: Database;

  beforeEach(() => {
    db = new Database();
  });

  describe('connect', () => {
    it('should connect to database', async () => {
      await expect(db.connect()).resolves.not.toThrow();
    });
  });

  describe('user operations', () => {
    it('should create and retrieve user', async () => {
      const userData: Partial<User> = {
        name: 'Test User',
        email: 'test@example.com',
        department: 'IT',
        role: 'user',
      };

      const createdUser = await db.createUser(userData);
      expect(createdUser).toBeDefined();
      expect(createdUser.name).toBe(userData.name);

      if (createdUser.id) {
        const retrievedUser = await db.getUser(createdUser.id);
        expect(retrievedUser).toBeDefined();
        expect(retrievedUser?.name).toBe(userData.name);
      }
    });
  });

  describe('inquiry operations', () => {
    it('should create and retrieve inquiry', async () => {
      const inquiryData: Partial<Inquiry> = {
        userId: 'test-user-1',
        title: 'Test Inquiry',
        content: 'Test content',
        category: 'software',
        priority: 'medium',
        status: 'open',
        tags: [],
        timestamp: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdInquiry = await db.createInquiry(inquiryData as Inquiry);
      expect(createdInquiry).toBeDefined();
      expect(createdInquiry.title).toBe(inquiryData.title);

      const retrievedInquiry = await db.getInquiry(createdInquiry.id);
      expect(retrievedInquiry).toBeDefined();
      expect(retrievedInquiry?.title).toBe(inquiryData.title);
    });
  });
});
