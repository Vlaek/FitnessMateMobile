import { fireEvent, render } from '@testing-library/react-native';
import { NumericField } from './numeric-field';

describe('NumericField', () => {
  it('keeps the visible value empty while emitting zero', async () => {
    const onValueChange = jest.fn();
    const view = await render(
      <NumericField label="Weight" value={12} onValueChange={onValueChange} />,
    );
    const input = view.getByLabelText('Weight');

    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '');

    expect(view.getByLabelText('Weight').props.value).toBe('');
    expect(onValueChange).toHaveBeenLastCalledWith(0);
  });

  it('accepts a decimal comma', async () => {
    const onValueChange = jest.fn();
    const view = await render(
      <NumericField label="Weight" value={0} onValueChange={onValueChange} />,
    );

    await fireEvent(view.getByLabelText('Weight'), 'focus');
    await fireEvent.changeText(view.getByLabelText('Weight'), '12,5');

    expect(onValueChange).toHaveBeenLastCalledWith(12.5);
  });

  it('truncates a pasted decimal in integer mode without joining digits', async () => {
    const onValueChange = jest.fn();
    const view = await render(
      <NumericField integer label="Reps" value={0} onValueChange={onValueChange} />,
    );

    await fireEvent(view.getByLabelText('Reps'), 'focus');
    await fireEvent.changeText(view.getByLabelText('Reps'), '12.5');

    expect(onValueChange).toHaveBeenLastCalledWith(12);
  });

  it('clamps a pasted negative value to zero', async () => {
    const onValueChange = jest.fn();
    const view = await render(
      <NumericField label="Weight" value={10} onValueChange={onValueChange} />,
    );

    await fireEvent(view.getByLabelText('Weight'), 'focus');
    await fireEvent.changeText(view.getByLabelText('Weight'), '-5');

    expect(onValueChange).toHaveBeenLastCalledWith(0);
  });
});
