import { Children, cloneElement, isValidElement, useState } from "react";
import { Platform, Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import Icon from "./Icon";
import Text from "./Text";
import { haptics } from "../../utils/haptics";
import { colors, MAX_FONT_SCALE, radius } from "../../theme";

export function FormSection({ title, footer, action, children, style, plainTitle = false }) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.section, style]}>
      {title || action ? (
        <View style={styles.sectionHeader}>
          {title ? (
            <Text
              numberOfLines={1}
              style={styles.sectionTitle}
              tone={plainTitle ? "default" : "muted"}
              variant={plainTitle ? "headline" : "footnote"}
              weight="600"
            >
              {plainTitle ? title : String(title).toUpperCase()}
            </Text>
          ) : (
            <View />
          )}
          {action}
        </View>
      ) : null}
      <View style={styles.card}>
        {rows.map((row, index) =>
          isValidElement(row) ? cloneElement(row, { last: row.props.last ?? index === rows.length - 1 }) : row,
        )}
      </View>
      {footer ? (
        <Text style={styles.footer} tone="muted" variant="footnote">
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export function FormRow({ last, children, style, minHeight = 52 }) {
  return (
    <View style={[styles.rowOuter, { minHeight }]}>
      <View style={[styles.row, !last && styles.separator, style]}>{children}</View>
    </View>
  );
}

function Label({ children, width }) {
  return (
    <Text numberOfLines={2} style={[styles.label, width ? { width } : null]} variant="body">
      {children}
    </Text>
  );
}

export function FormTextRow({
  label,
  last,
  prefix,
  align = "right",
  labelWidth = 120,
  editable = true,
  ...inputProps
}) {
  return (
    <FormRow last={last}>
      <Label width={labelWidth}>{label}</Label>
      <View style={styles.valueArea}>
        {prefix ? (
          <Text tone="muted" variant="body">
            {prefix}
          </Text>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          editable={editable}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          placeholderTextColor={colors.subtle}
          style={[styles.input, { textAlign: align }, !editable && styles.readonly]}
          {...inputProps}
        />
      </View>
    </FormRow>
  );
}

export function FormMultilineRow({ label, last, ...inputProps }) {
  return (
    <FormRow last={last} style={styles.stacked}>
      {label ? (
        <Text tone="muted" variant="subhead" weight="600">
          {label}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        multiline
        placeholderTextColor={colors.subtle}
        style={styles.multiline}
        textAlignVertical="top"
        {...inputProps}
      />
    </FormRow>
  );
}

export function FormValueRow({ label, value, last, strong, tone, labelTone = "default" }) {
  return (
    <FormRow last={last}>
      <Text style={styles.flexLabel} tone={labelTone} variant={strong ? "headline" : "body"}>
        {label}
      </Text>
      <Text
        align="right"
        style={styles.value}
        tone={tone ?? (strong ? "default" : "muted")}
        variant={strong ? "title2" : "body"}
        weight={strong ? "700" : "400"}
      >
        {value}
      </Text>
    </FormRow>
  );
}

export function FormNavRow({ label, value, placeholder, onPress, last, disabled, subtitle, leading, testID }) {
  return (
    <Pressable
      accessibilityLabel={value ? `${label}: ${value}` : label}
      accessibilityRole="button"
      disabled={disabled || !onPress}
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      style={({ pressed }) => [pressed && styles.pressed]}
      testID={testID}
    >
      <FormRow last={last} minHeight={subtitle ? 64 : 52}>
        {leading}
        <View style={styles.navText}>
          <Text tone={value ? "default" : "accent"} variant="body" weight={value ? "600" : "400"}>
            {value || placeholder || label}
          </Text>
          {subtitle ? (
            <Text tone="muted" variant="subhead">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {!disabled && onPress ? <Icon color={colors.subtle} name="chevronRight" size={14} /> : null}
      </FormRow>
    </Pressable>
  );
}

export function FormSegmentedRow({ label, options, value, onChange, last, disabled }) {
  const index = Math.max(0, options.indexOf(value));
  return (
    <FormRow last={last}>
      <Label>{label}</Label>
      <SegmentedControl
        activeFontStyle={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}
        backgroundColor={colors.surfaceMuted}
        enabled={!disabled}
        fontStyle={{ color: colors.navy, fontSize: 15, fontWeight: "500" }}
        onChange={(event) => {
          haptics.selection();
          onChange(options[event.nativeEvent.selectedSegmentIndex]);
        }}
        selectedIndex={index}
        style={styles.segmented}
        tintColor={colors.orange}
        values={options}
      />
    </FormRow>
  );
}

export function FormSwitchRow({ label, description, value, onValueChange, last, disabled, testID }) {
  return (
    <FormRow last={last} minHeight={description ? 64 : 52}>
      <View style={styles.navText}>
        <Text variant="body" weight="600">
          {label}
        </Text>
        {description ? (
          <Text tone="muted" variant="subhead">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        onValueChange={(next) => {
          haptics.selection();
          onValueChange(next);
        }}
        testID={testID}
        trackColor={{ true: colors.success }}
        value={value}
      />
    </FormRow>
  );
}

function parseDate(value) {
  if (!value) return new Date();
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const [day, month, year] = String(value).split("/").map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toBR(date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export function FormDateRow({ label, value, onChange, last, disabled }) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  return (
    <FormRow last={last}>
      <Label>{label}</Label>
      <View style={styles.dateArea}>
        {disabled ? (
          <Text tone="muted" variant="body">
            {value || "—"}
          </Text>
        ) : Platform.OS === "ios" ? (
          <DateTimePicker
            accentColor={colors.orange}
            display="compact"
            locale="pt-BR"
            mode="date"
            onChange={(_, date) => date && onChange(toBR(date))}
            value={selected}
          />
        ) : (
          <Pressable
            accessibilityLabel={`${label}: ${value || "selecionar"}`}
            accessibilityRole="button"
            onPress={() => setOpen(true)}
            style={styles.androidDate}
          >
            <Text tone="accent" variant="body" weight="600">
              {value || "Selecionar"}
            </Text>
          </Pressable>
        )}
        {open ? (
          <DateTimePicker
            display="default"
            mode="date"
            onChange={(event, date) => {
              setOpen(false);
              if (event.type !== "dismissed" && date) onChange(toBR(date));
            }}
            value={selected}
          />
        ) : null}
      </View>
    </FormRow>
  );
}

export function Stepper({ value, onDecrement, onIncrement, removeOnMin, label, min = 1 }) {
  const numeric = typeof value === "object" ? Number(value?.props?.value || 0) : Number(value);
  const atMin = numeric <= min;
  const showTrash = removeOnMin && atMin;
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityLabel={showTrash ? `Remover ${label}` : `Diminuir ${label}`}
        accessibilityRole="button"
        disabled={!showTrash && atMin}
        onPress={() => {
          haptics.selection();
          onDecrement();
        }}
        style={({ pressed }) => [styles.stepButton, !showTrash && atMin && styles.dim, pressed && styles.pressed]}
      >
        <Icon
          color={showTrash ? colors.danger : colors.navy}
          name={showTrash ? "trash" : "minus"}
          size={17}
          weight="bold"
        />
      </Pressable>
      {typeof value === "object" ? (
        value
      ) : (
        <Text align="center" style={styles.stepValue} variant="headline">
          {value}
        </Text>
      )}
      <Pressable
        accessibilityLabel={`Aumentar ${label}`}
        accessibilityRole="button"
        onPress={() => {
          haptics.selection();
          onIncrement();
        }}
        style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
      >
        <Icon color={colors.navy} name="plus" size={17} weight="bold" />
      </Pressable>
    </View>
  );
}

export function FormButtonRow({ label, icon = "plus", onPress, last, tone = "accent", testID }) {
  const color = tone === "danger" ? colors.danger : colors.orange;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => {
        haptics.light();
        onPress();
      }}
      style={({ pressed }) => [pressed && styles.pressed]}
      testID={testID}
    >
      <FormRow last={last}>
        <View style={styles.buttonRow}>
          <Icon color={color} name={icon} size={18} weight="bold" />
          <Text style={{ color }} variant="body" weight="600">
            {label}
          </Text>
        </View>
      </FormRow>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 },
  sectionTitle: { flexShrink: 1, letterSpacing: 0.3 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, overflow: "hidden" },
  footer: { paddingHorizontal: 16 },
  rowOuter: { justifyContent: "center", paddingLeft: 16 },
  row: { alignItems: "center", flex: 1, flexDirection: "row", gap: 12, paddingRight: 16, paddingVertical: 10 },
  separator: { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
  stacked: { alignItems: "stretch", flexDirection: "column", gap: 6 },
  label: { color: colors.text },
  flexLabel: { flex: 1 },
  valueArea: { alignItems: "center", flex: 1, flexDirection: "row", gap: 4, justifyContent: "flex-end" },
  input: { color: colors.text, flex: 1, fontSize: 17, minHeight: 32, paddingVertical: 6 },
  readonly: { color: colors.muted },
  multiline: { color: colors.text, fontSize: 17, lineHeight: 24, minHeight: 88, padding: 0 },
  value: { flexShrink: 1, fontVariant: ["tabular-nums"] },
  navText: { flex: 1, gap: 2 },
  segmented: { flex: 1, height: 36, maxWidth: 220 },
  dateArea: { alignItems: "flex-end", flex: 1 },
  androidDate: { justifyContent: "center", minHeight: 44 },
  stepper: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flexDirection: "row",
  },
  stepButton: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  stepValue: { fontVariant: ["tabular-nums"], minWidth: 28 },
  buttonRow: { alignItems: "center", flexDirection: "row", gap: 8, minHeight: 32 },
  dim: { opacity: 0.35 },
  pressed: { backgroundColor: colors.surfaceMuted },
});
