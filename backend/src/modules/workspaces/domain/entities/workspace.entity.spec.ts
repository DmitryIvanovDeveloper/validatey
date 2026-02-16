import { describe, it, expect } from 'vitest';
import { WorkspaceEntity } from './workspace.entity';

describe('WorkspaceEntity', () => {
  describe('create', () => {
    it('should create a workspace with valid data', () => {
      const userId = 'user-123';
      const name = 'My Workspace';

      const workspace = WorkspaceEntity.create(userId, name);

      expect(workspace.id).toBeDefined();
      expect(workspace.userId).toBe(userId);
      expect(workspace.name).toBe(name);
      expect(workspace.createdAt).toBeInstanceOf(Date);
      expect(workspace.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for empty name', () => {
      expect(() => {
        WorkspaceEntity.create('user-123', '');
      }).toThrow('Workspace name is required');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => {
        WorkspaceEntity.create('user-123', '   ');
      }).toThrow('Workspace name is required');
    });

    it('should throw error for name too long', () => {
      const longName = 'a'.repeat(256);
      expect(() => {
        WorkspaceEntity.create('user-123', longName);
      }).toThrow('Workspace name must be less than 255 characters');
    });
  });

  describe('fromData', () => {
    it('should create entity from data object', () => {
      const data = {
        id: 'workspace-123',
        userId: 'user-123',
        name: 'Test Workspace',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      const workspace = WorkspaceEntity.fromData(data);

      expect(workspace.id).toBe(data.id);
      expect(workspace.userId).toBe(data.userId);
      expect(workspace.name).toBe(data.name);
      expect(workspace.createdAt).toBe(data.createdAt);
      expect(workspace.updatedAt).toBe(data.updatedAt);
    });
  });

  describe('withName', () => {
    it('should return new entity with updated name', () => {
      const workspace = WorkspaceEntity.create('user-123', 'Old Name');
      const updated = workspace.withName('New Name');

      expect(updated.name).toBe('New Name');
      expect(updated.id).toBe(workspace.id);
      expect(updated.userId).toBe(workspace.userId);
      expect(updated.createdAt).toBe(workspace.createdAt);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(workspace.updatedAt.getTime());
    });

    it('should trim whitespace from name', () => {
      const workspace = WorkspaceEntity.create('user-123', 'Test');
      const updated = workspace.withName('  New Name  ');

      expect(updated.name).toBe('New Name');
    });
  });

  describe('toData', () => {
    it('should return data object', () => {
      const workspace = WorkspaceEntity.create('user-123', 'Test Workspace');
      const data = workspace.toData();

      expect(data.id).toBe(workspace.id);
      expect(data.userId).toBe(workspace.userId);
      expect(data.name).toBe(workspace.name);
      expect(data.createdAt).toBe(workspace.createdAt);
      expect(data.updatedAt).toBe(workspace.updatedAt);
    });
  });
});