import HeaderAvatar from "./HeaderAvatar";
import HeaderLogo from "./HeaderLogo";
import HeaderTextButton from "./HeaderTextButton";

const WHITE = "#ffffff";

const ORANGE = "#ef7f19";

function addItem(add) {
  const shared = {
    label: add.label,
    accessibilityLabel: add.label,
    icon: { type: "sfSymbol", name: "plus" },
    variant: "prominent",
    tintColor: ORANGE,
  };
  if (!add.menu) return { ...shared, type: "button", onPress: add.onPress };
  return {
    ...shared,
    type: "menu",
    menu: {
      title: add.menuTitle,
      items: add.menu.map((option) => ({
        type: "action",
        label: option.label,
        description: option.description,
        icon: option.sf ? { type: "sfSymbol", name: option.sf } : undefined,
        onPress: option.onPress,
      })),
    },
  };
}

export function brandHeaderOptions(add) {
  return {
    headerLeft: () => <HeaderLogo />,
    headerRight: () => <HeaderAvatar />,
    unstable_headerLeftItems: () => [{ type: "custom", element: <HeaderLogo />, hidesSharedBackground: true }],
    unstable_headerRightItems: () => [
      ...(add ? [addItem(add)] : []),
      { type: "custom", element: <HeaderAvatar />, hidesSharedBackground: true },
    ],
  };
}

export function headerButtonOptions({ label, onPress, side = "left", prominent = false }) {
  const item = {
    type: "button",
    label,
    onPress,
    labelStyle: { color: WHITE, fontWeight: prominent ? "700" : "600" },
    tintColor: prominent ? "#ef7f19" : WHITE,
    variant: prominent ? "prominent" : "plain",
  };
  const fallback = () => <HeaderTextButton bold={prominent} color={WHITE} label={label} onPress={onPress} />;
  return side === "left"
    ? { headerLeft: fallback, unstable_headerLeftItems: () => [item] }
    : { headerRight: fallback, unstable_headerRightItems: () => [item] };
}

export function headerCustomOptions(element, side = "right") {
  return side === "left"
    ? {
        headerLeft: () => element,
        unstable_headerLeftItems: () => [{ type: "custom", element, hidesSharedBackground: true }],
      }
    : {
        headerRight: () => element,
        unstable_headerRightItems: () => [{ type: "custom", element, hidesSharedBackground: true }],
      };
}
