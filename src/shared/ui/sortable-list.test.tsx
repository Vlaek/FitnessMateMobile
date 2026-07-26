import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { SortableList } from './sortable-list';

describe('SortableList', () => {
  it('renders stable sortable rows with long-press accessibility hints', async () => {
    const view = await render(
      <SortableList
        data={[
          { id: 'a', label: 'First' },
          { id: 'b', label: 'Second' },
        ]}
        keyExtractor={(item) => item.id}
        onReorder={jest.fn()}
        renderItem={(item) => <Text>{item.label}</Text>}
      />,
    );

    expect(view.getByTestId('sortable-item-a')).toHaveProp(
      'accessibilityHint',
      'Long press and drag to change position',
    );
    expect(view.getByTestId('sortable-item-b')).toBeTruthy();
  });
});
