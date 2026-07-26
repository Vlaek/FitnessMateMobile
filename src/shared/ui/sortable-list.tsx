import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, type GestureType } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { moveItem, targetIndexForDrag, type TItemLayout } from '@/shared/lib/reorder';

export type TSortableDragGesture = GestureType;

type TProps<T> = {
  data: readonly T[];
  keyExtractor: (item: T) => string;
  onReorder: (from: number, to: number) => void;
  renderItem: (item: T, index: number, dragGesture: TSortableDragGesture) => ReactNode;
  accessibilityHint?: string;
  disabled?: boolean;
  gap?: number;
};

export function SortableList<T>({
  data,
  keyExtractor,
  onReorder,
  renderItem,
  accessibilityHint = 'Long press and drag to change position',
  disabled = false,
  gap = 14,
}: TProps<T>) {
  const layouts = useRef<TItemLayout[]>([]);
  const previewRef = useRef<readonly T[]>(data);
  const sourceIndex = useRef(0);
  const targetIndex = useRef(0);
  const startCenterY = useRef(0);
  const activeKey = useRef<string | null>(null);
  const [previewData, setPreviewData] = useState<readonly T[]>(data);

  useEffect(() => {
    if (activeKey.current === null) {
      previewRef.current = data;
      setPreviewData(data);
    }
  }, [data]);

  const beginDrag = useCallback((key: string, index: number) => {
    const layout = layouts.current[index];

    if (!layout) {
      return;
    }

    activeKey.current = key;
    sourceIndex.current = index;
    targetIndex.current = index;
    startCenterY.current = layout.y + layout.height / 2;
  }, []);

  const updateDrag = useCallback(
    (key: string, translationY: number) => {
      if (activeKey.current !== key) {
        return;
      }

      const currentIndex = previewRef.current.findIndex((item) => keyExtractor(item) === key);

      if (currentIndex < 0) {
        return;
      }

      const nextIndex = targetIndexForDrag(
        currentIndex,
        startCenterY.current + translationY,
        layouts.current,
      );

      if (nextIndex === currentIndex) {
        return;
      }

      const next = moveItem(previewRef.current, currentIndex, nextIndex);
      previewRef.current = next;
      targetIndex.current = nextIndex;
      setPreviewData(next);
    },
    [keyExtractor],
  );

  const finishDrag = useCallback(
    (key: string) => {
      if (activeKey.current !== key) {
        return;
      }

      const from = sourceIndex.current;
      const to = targetIndex.current;
      activeKey.current = null;

      if (from !== to) {
        onReorder(from, to);
      }
    },
    [onReorder],
  );

  return (
    <View style={{ gap }}>
      {previewData.map((item, index) => {
        const key = keyExtractor(item);

        return (
          <SortableRow
            accessibilityHint={accessibilityHint}
            disabled={disabled}
            key={key}
            testID={`sortable-item-${key}`}
            onLayout={(layout) => {
              layouts.current[index] = layout;
            }}
            onDragStart={() => beginDrag(key, index)}
            onDrag={(translationY) => updateDrag(key, translationY)}
            onDrop={() => finishDrag(key)}
            renderItem={(dragGesture) => renderItem(item, index, dragGesture)}
          />
        );
      })}
    </View>
  );
}

function SortableRow({
  accessibilityHint,
  disabled,
  onDrag,
  onDragStart,
  onDrop,
  onLayout,
  renderItem,
  testID,
}: {
  accessibilityHint: string;
  disabled: boolean;
  onDrag: (translationY: number) => void;
  onDragStart: () => void;
  onDrop: () => void;
  onLayout: (layout: TItemLayout) => void;
  renderItem: (dragGesture: TSortableDragGesture) => ReactNode;
  testID: string;
}) {
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const gesture = Gesture.Pan()
    .enabled(!disabled)
    .activateAfterLongPress(350)
    .onStart(() => {
      isActive.value = true;
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
      runOnJS(onDrag)(event.translationY);
    })
    .onFinalize(() => {
      runOnJS(onDrop)();
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
    <Animated.View
      accessibilityHint={accessibilityHint}
      layout={LinearTransition.duration(180)}
      onLayout={measure}
      style={[styles.row, animatedStyle]}
      testID={testID}
    >
      {renderItem(gesture)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
  },
});
