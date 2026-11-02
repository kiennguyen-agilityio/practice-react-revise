import { describe, expect, it } from 'vitest';

// helpers
import { assertFoodList } from '@app/helpers/validateFoods';

const food = { id: '1', name: 'Pho' };

describe('assertFoodList', () => {
  it.each([
    ['an empty array', []],
    ['a list of foods', [food, { id: '2' }]],
  ])('accepts %s', (_label, body) => {
    expect(assertFoodList(body)).toBe(body);
  });

  it.each([
    ['an empty object', {}],
    ['an error-shaped object', { message: 'oops' }],
    ['null', null],
    ['undefined', undefined],
    ['a string', 'ok'],
    ['a number', 42],
    ['a list containing null', [food, null]],
    ['a list containing a string', [food, 'x']],
    ['a list with a food missing its id', [food, { name: 'No id' }]],
    ['a list with a numeric id', [{ id: 1 }]],
  ])('rejects %s', (_label, body) => {
    expect(() => assertFoodList(body)).toThrow('Invalid foods response');
  });
});
