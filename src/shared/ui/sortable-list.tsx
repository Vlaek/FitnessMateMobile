import { useRef, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { targetIndexForDrag, type ItemLayout } from '@/shared/lib/reorder';

type Props<T> = {
  data: readonly T[];
  keyExtractor: (item: T) => string;
  onReorder: (from: number, to: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  accessibilityHint?: string;
  gap?: number;
};

export function SortableList<T>({
  data,
  keyExtractor,
  onReorder,
  renderItem,
  accessibilityHint = 'Long press and drag to change position',
  gap = 14,
}: Props<T>) {
  const layouts = useRef<ItemLayout[]>([]);

  return (
    <View style={{ gap }}>
      {data.map((item, index) => {
        const key = keyExtractor(item);
        return (
          <SortableRow
            accessibilityHint={accessibilityHint}
            key={key}
            testID={`sortable-item-${key}`}
            onLayout={(layout) => {
              layouts.current[index] = layout;
            }}
            onDrop={(translationY) => {
              const layout = layouts.current[index];
              if (!layout) return;
              const centerY = layout.y + layout.height / 2 + translationY;
              onReorder(index, targetIndexForDrag(index, centerY, layouts.current));
            }}
          >
            {renderItem(item, index)}
          </SortableRow>
        );
      })}
    </View>
  );
}

function SortableRow({
  accessibilityHint,
  children,
  onDrop,
  onLayout,
  testID,
}: {
  accessibilityHint: string;
  children: ReactNode;
  onDrop: (translationY: number) => void;
  onLayout: (layout: ItemLayout) => void;
  testID: string;
}) {
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const gesture = Gesture.Pan()
    .activateAfterLongPress(350)
    .onStart(() => {
      isActive.value = true;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onFinalize(() => {
      runOnJS(onDrop)(translateY.value);
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      isActive.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isActive.value ? 0.94 : 1,
    transform: [{ scale: isActive.value ? 1.015 : 1 }, { translateY: translateY.value }],
    zIndex: isActive.value ? 10 : 0,
  }));

  const measure = (event: LayoutChangeEvent) => {
    onLayout(event.nativeEvent.layout);
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessibilityHint={accessibilityHint}
        layout={LinearTransition.duration(180)}
        onLayout={measure}
        style={[styles.row, animatedStyle]}
        testID={testID}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
  },
});
