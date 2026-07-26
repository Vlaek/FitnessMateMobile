import { moveItem, targetIndexForDrag } from './reorder';

describe('reorder helpers', () => {
  it('moves an item to an arbitrary destination', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('keeps the original reference for an invalid destination', () => {
    const values = ['a', 'b'];

    expect(moveItem(values, 0, 3)).toBe(values);
  });

  it('uses measured card centers to resolve a variable-height drag', () => {
    const layouts = [
      { y: 0, height: 80 },
      { y: 92, height: 140 },
      { y: 244, height: 90 },
    ];

    expect(targetIndexForDrag(0, 220, layouts)).toBe(1);
    expect(targetIndexForDrag(0, 300, layouts)).toBe(2);
  });

  it('clamps a drag before the first and after the last card', () => {
    const layouts = [
      { y: 0, height: 60 },
      { y: 72, height: 60 },
    ];

    expect(targetIndexForDrag(1, -100, layouts)).toBe(0);
    expect(targetIndexForDrag(0, 500, layouts)).toBe(1);
  });
});
