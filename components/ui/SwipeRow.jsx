import { useCallback, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { GestureDetector, useExclusiveGestures, usePanGesture, useTapGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Icon from "./Icon";
import Text from "./Text";
import { haptics } from "../../utils/haptics";
import { radius, shadow } from "../../theme";

const ACTION_WIDTH = 78;
const FULL_SWIPE_RATIO = 0.62;
const SPRING = { damping: 32, stiffness: 340, mass: 0.9 };

let openRow = null;

function Action({ action, index, count, armed }) {
  const isPrimary = index === count - 1;
  const style = useAnimatedStyle(() => ({
    flexGrow: isPrimary ? 1 + armed.get() * 40 : Math.max(1 - armed.get(), 0.0001),
  }));
  return (
    <Animated.View style={[styles.actionSlot, { backgroundColor: action.color }, style]}>
      <Pressable
        accessibilityLabel={action.label}
        accessibilityRole="button"
        onPress={action.run}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        testID={action.testID}
      >
        <Icon color="#ffffff" name={action.icon} size={22} />
        <Text numberOfLines={1} tone="inverse" variant="footnote" weight="700">
          {action.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function SwipeRow({
  actions = [],
  children,
  style,
  clipStyle,
  flat = false,
  onPress,
  onPressIn,
  accessibilityLabel,
}) {
  const enabled = Platform.OS === "ios" && (actions.length > 0 || Boolean(onPress));
  const swipeEnabled = Platform.OS === "ios" && actions.length > 0;
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const rowWidth = useSharedValue(0);
  const armed = useSharedValue(0);
  const pressed = useSharedValue(0);
  const [open, setOpen] = useState(false);
  const token = useRef({});
  const total = actions.length * ACTION_WIDTH;

  const close = useCallback(() => {
    x.set(withSpring(0, SPRING));
    armed.set(withTiming(0, { duration: 120 }));
    setOpen(false);
    if (openRow?.token === token.current) openRow = null;
  }, [armed, x]);

  const markOpen = useCallback(() => {
    if (openRow && openRow.token !== token.current) openRow.close();
    openRow = { token: token.current, close };
    setOpen(true);
  }, [close]);

  const run = useCallback(
    (action) => {
      haptics.medium();
      close();
      action.onPress();
    },
    [close],
  );

  const runPrimary = useCallback(() => {
    const primary = actions[actions.length - 1];
    if (primary) {
      primary.onPress();
      close();
    }
  }, [actions, close]);

  const armHaptic = useCallback(() => haptics.medium(), []);

  const pan = usePanGesture({
    enabled: swipeEnabled,
    activeOffsetX: [-14, 14],
    failOffsetY: [-12, 12],
    onActivate: () => {
      "worklet";
      start.set(x.get());
    },
    onUpdate: (event) => {
      "worklet";
      let next = start.get() + event.translationX;
      if (next > 0) next = next / 5;
      const fullDistance = rowWidth.get() * FULL_SWIPE_RATIO;
      const shouldArm = -next > Math.max(fullDistance, total + 40);
      if (shouldArm !== armed.get() > 0.5) {
        armed.set(withTiming(shouldArm ? 1 : 0, { duration: 140 }));
        if (shouldArm) scheduleOnRN(armHaptic);
      }
      x.set(next);
    },
    onDeactivate: (event) => {
      "worklet";
      if (armed.get() > 0.5) {
        x.set(withTiming(-rowWidth.get(), { duration: 160 }));
        scheduleOnRN(runPrimary);
        return;
      }
      const opening = (x.get() < -total / 2 || event.velocityX < -650) && event.velocityX < 450;
      if (opening) {
        x.set(withSpring(-total, { ...SPRING, velocity: event.velocityX }));
        scheduleOnRN(markOpen);
      } else {
        x.set(withSpring(0, { ...SPRING, velocity: event.velocityX }));
        scheduleOnRN(setOpen, false);
      }
    },
  });

  const handleTap = useCallback(() => {
    if (open) {
      close();
      return;
    }
    onPress?.();
  }, [close, onPress, open]);

  const tap = useTapGesture({
    enabled: enabled && (Boolean(onPress) || open),
    maxDuration: 600,
    onBegin: () => {
      "worklet";
      pressed.set(withTiming(1, { duration: 60 }));
      if (onPressIn) scheduleOnRN(onPressIn);
    },
    onActivate: () => {
      "worklet";
      scheduleOnRN(handleTap);
    },
    onFinalize: () => {
      "worklet";
      pressed.set(withTiming(0, { duration: 160 }));
    },
  });

  const gesture = useExclusiveGestures(pan, tap);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.get() * 0.15,
    transform: [{ translateX: x.get() }, { scale: 1 - pressed.get() * 0.01 }],
  }));
  const actionsStyle = useAnimatedStyle(() => ({ width: Math.max(-x.get(), 0) }));

  if (!enabled) return <View style={style}>{children}</View>;

  const runnable = actions.map((action) => ({ ...action, run: () => run(action) }));

  return (
    <View
      accessibilityActions={actions.map((action) => ({ name: action.label, label: action.label }))}
      onAccessibilityAction={(event) => {
        const action = actions.find((item) => item.label === event.nativeEvent.actionName);
        if (action) action.onPress();
      }}
      onLayout={(event) => {
        rowWidth.set(event.nativeEvent.layout.width);
      }}
      style={[flat ? null : styles.shadow, style]}
    >
      <View style={[styles.clip, clipStyle]}>
        <Animated.View style={[styles.actions, actionsStyle]}>
          {runnable.map((action, index) => (
            <Action action={action} armed={armed} count={runnable.length} index={index} key={action.label} />
          ))}
        </Animated.View>
        <GestureDetector gesture={gesture}>
          <Animated.View
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={onPress ? "button" : undefined}
            accessible={Boolean(onPress)}
            onAccessibilityTap={onPress}
            style={contentStyle}
          >
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { ...shadow, borderRadius: radius.card },
  clip: { borderRadius: radius.card, overflow: "hidden" },
  actions: { bottom: 0, flexDirection: "row", position: "absolute", right: 0, top: 0 },
  actionSlot: { flexBasis: 0, overflow: "hidden" },
  action: { alignItems: "center", flex: 1, gap: 4, justifyContent: "center", minWidth: ACTION_WIDTH },
  pressed: { opacity: 0.8 },
});
