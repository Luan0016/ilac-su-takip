import { renderRouter } from 'expo-router/testing-library';
import TabLayout from '../app/(tabs)/_layout';
import MedicationsLayout from '../app/(tabs)/medications/_layout';

const Empty = () => null;

it('shows the five tabs with Turkish labels', async () => {
  const screen = await renderRouter(
    {
      '(tabs)/_layout': TabLayout,
      '(tabs)/index': Empty,
      '(tabs)/medications/_layout': MedicationsLayout,
      '(tabs)/medications/index': Empty,
      '(tabs)/water': Empty,
      '(tabs)/history': Empty,
      '(tabs)/settings': Empty,
    },
    { initialUrl: '/' },
  );
  for (const label of ['Bugün', 'İlaçlar', 'Su', 'Geçmiş', 'Ayarlar']) {
    expect(await screen.findAllByText(label)).not.toHaveLength(0);
  }
});
