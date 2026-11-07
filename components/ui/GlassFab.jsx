import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassContainer, GlassView } from "expo-glass-effect";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Icon from "./Icon";
import Text from "./Text";
import { canUseGlass } from "../../utils/glass";
import { haptics } from "../../utils/haptics";
import { colors, radius, shadowStrong, touch } from "../../theme";

function Surface({ glass, tint, style, children }) {
  if (glass) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive style={style} tintColor={tint}>
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[style, styles.solidShadow, { backgroundColor: tint ?? colors.surface, overflow: "visible" }]}>
      {children}
    </View>
  );
}

function Option({ action, index, total, glass, onSelect }) {
  return (
    <Animated.View
      entering={FadeInDown.delay((total - index - 1) * 25).duration(170)}
      exiting={FadeOutDown.duration(90)}
    >
      <Pressable
        accessibilityLabel={action.label}
        accessibilityRole="button"
        onPress={() => onSelect(action)}
        style={({ pressed }) => pressed && styles.pressed}
        testID={action.testID}
      >
        <Surface glass={glass} style={styles.option}>
          <View style={styles.optionIcon}>
            <Icon
              color={colors.orange}
              feather={action.icon?.feather}
              name={typeof action.icon === "string" ? action.icon : undefined}
              sf={action.icon?.sf}
              size={20}
            />
          </View>
          <View style={styles.optionText}>
            <Text variant="headline">{action.label}</Text>
            {action.description ? (
              <Text tone="muted" variant="footnote">
                {action.description}
              </Text>
            ) : null}
          </View>
        </Surface>
      </Pressable>
    </Animated.View>
  );
}

export default function GlassFab({ label, icon = "plus", onPress, actions, testID = "glass-fab" }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);
  const glass = canUseGlass();
  const hasMenu = Array.isArray(actions) && actions.length > 0;
  const bottom = Platform.OS === "ios" ? 16 + Math.max(insets.bottom, 8) : 22;

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  function setMenu(next) {
    setOpen(next);
    rotation.value = withSpring(next ? 135 : 0, { damping: 18, stiffness: 320 });
  }

  function handlePress() {
    haptics.light();
    if (!hasMenu) {
      onPress?.();
      return;
    }
    setMenu(!open);
  }

  function select(action) {
    haptics.selection();
    setMenu(false);
    action.onPress();
  }

  const Container = glass ? GlassContainer : View;

  return (
    <>
      {open ? (
        <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(100)} style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Fechar opções"
            onPress={() => setMenu(false)}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
      <Container pointerEvents="box-none" spacing={14} style={[styles.anchor, { bottom }]}>
        {open
          ? actions.map((action, index) => (
              <Option
                action={action}
                glass={glass}
                index={index}
                key={action.label}
                onSelect={select}
                total={actions.length}
              />
            ))
          : null}
        <Pressable
          accessibilityLabel={hasMenu && open ? "Fechar opções" : label}
          accessibilityRole="button"
          accessibilityState={hasMenu ? { expanded: open } : undefined}
          onPress={handlePress}
          style={({ pressed }) => pressed && styles.pressed}
          testID={testID}
        >
          <Surface glass={glass} style={styles.fab} tint={colors.orange}>
            <Animated.View style={iconStyle}>
              <Icon color="#ffffff" name={icon} size={22} weight="bold" />
            </Animated.View>
            <Text tone="inverse" variant="headline">
              {open ? "Fechar" : label}
            </Text>
          </Surface>
        </Pressable>
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  anchor: { alignItems: "flex-end", gap: 12, position: "absolute", right: 20 },
  fab: {
    alignItems: "center",
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 10,
    minHeight: touch.large,
    overflow: "hidden",
    paddingHorizontal: 22,
  },
  option: {
    alignItems: "center",
    borderRadius: 22,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    minWidth: 250,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  optionIcon: {
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  optionText: { flexShrink: 1, gap: 2 },
  solidShadow: shadowStrong,
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
