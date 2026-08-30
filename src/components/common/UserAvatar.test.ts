import { describe, expect, it } from 'vitest';
import { userInitials } from './UserAvatar';

describe('userInitials', () => {
  it('usa a primeira e a última inicial do nome', () => {
    expect(userInitials('Maria da Silva')).toBe('MS');
  });

  it('suporta nome único e ausência de nome', () => {
    expect(userInitials('Admin')).toBe('A');
    expect(userInitials('')).toBe('?');
  });
});
