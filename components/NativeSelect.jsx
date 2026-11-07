import { ActionMenuSheet, useActionMenu } from "./ActionMenu";
import PickerField from "./ui/PickerField";
import { haptics } from "../utils/haptics";

export default function NativeSelect({ label, value, options, onSelect, placeholder = "Selecionar", disabled }) {
  const menu = useActionMenu();

  function open() {
    haptics.selection();
    menu.show({
      title: label,
      options: [
        ...options.map((option) => ({
          label: option === value ? `${option} ✓` : option,
          onPress: () => onSelect(option),
        })),
        { label: "Cancelar", cancel: true },
      ],
    });
  }

  return (
    <>
      <PickerField disabled={disabled} label={label} onPress={open} placeholder={placeholder} value={value} />
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
    </>
  );
}
