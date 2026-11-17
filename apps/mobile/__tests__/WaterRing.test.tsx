import { fireEvent, render, screen } from '@testing-library/react-native';
import { CupButtons } from '../src/components/CupButtons';
import { WaterRing } from '../src/components/WaterRing';

it('shows "750 / 2000 ml" and "%38"', async () => {
  await render(<WaterRing totalMl={750} goalMl={2000} />);
  expect(screen.getByText('750 / 2000 ml')).toBeTruthy();
  expect(screen.getByText('%38')).toBeTruthy();
});

it('caps at %100 when over goal', async () => {
  await render(<WaterRing totalMl={2600} goalMl={2000} />);
  expect(screen.getByText('%100')).toBeTruthy();
  expect(screen.getByText('2600 / 2000 ml')).toBeTruthy();
});

it('CupButtons pressing 300 calls onAdd(300)', async () => {
  const onAdd = jest.fn();
  await render(<CupButtons sizes={[200, 300, 500]} onAdd={onAdd} />);
  await fireEvent.press(screen.getByText('300 ml'));
  expect(onAdd).toHaveBeenCalledWith(300);
});

it('CupButtons custom amount adds the typed ml, ignores invalid input', async () => {
  const onAdd = jest.fn();
  await render(<CupButtons sizes={[200]} onAdd={onAdd} />);
  await fireEvent.press(screen.getByText('Özel'));
  await fireEvent.changeText(screen.getByLabelText('Miktar (ml)'), 'abc');
  await fireEvent.press(screen.getByText('Kaydet'));
  expect(onAdd).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Miktar (ml)'), '150');
  await fireEvent.press(screen.getByText('Kaydet'));
  expect(onAdd).toHaveBeenCalledWith(150);
});
