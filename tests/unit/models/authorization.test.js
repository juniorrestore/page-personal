const { InternalServerError } = require('infra/errors');
import authorization from 'models/authorization';

describe('authorization model', () => {
  describe('.can()', () => {
    test('without user', () => {
      expect(() => authorization.can()).toThrow(InternalServerError);
    });
    test('without feature', async () => {
      const createdUser = { username: 'test' };
      expect(() => authorization.can(createdUser)).toThrow(InternalServerError);
    });
    test('with feature unknown', async () => {
      const createdUser = { username: 'test', features: ['read:user'] };

      expect(() => authorization.can(createdUser, 'unknown:feature')).toThrow(
        InternalServerError,
      );
    });
    test('with  user and a known feature', async () => {
      const createdUser = { username: 'test', features: ['read:user'] };

      expect(authorization.can(createdUser, 'read:user')).toBe(true);
    });
  });

  describe('.filterOutput()', () => {
    test('without user', () => {
      expect(() => authorization.filterOutput()).toThrow(InternalServerError);
    });
    test('without feature', async () => {
      const createdUser = { username: 'test' };
      expect(() => authorization.filterOutput(createdUser)).toThrow(
        InternalServerError,
      );
    });
    test('with feature unknown', async () => {
      const createdUser = { username: 'test', features: ['read:user'] };

      expect(() =>
        authorization.filterOutput(createdUser, 'unknown:feature'),
      ).toThrow(InternalServerError);
    });
    test('with  user and a known feature but no resource', async () => {
      const createdUser = { username: 'test', features: ['read:user'] };

      expect(() =>
        authorization.filterOutput(createdUser, 'read:user'),
      ).toThrow(InternalServerError);
    });
    test('with  user and a known feature and resource', async () => {
      const createdUser = { username: 'test', features: ['read:user'] };
      const resource = {
        id: '123',
        username: 'test',
        features: ['read:user'],
        create_at: new Date().toISOString(),
        update_at: new Date().toISOString(),
        password: 'hashedpassword',
        email: 'test@example.com',
      };

      const result = {
        id: '123',
        username: 'test',
        features: ['read:user'],
        create_at: resource.create_at,
        update_at: resource.update_at,
      };

      expect(
        authorization.filterOutput(createdUser, 'read:user', resource),
      ).toEqual(result);
    });
  });
});
