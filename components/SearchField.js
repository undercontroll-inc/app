import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, TextInput, View } from "react-native";

export default function SearchField({ value, onChangeText, placeholder, autoFocus }) {
  return (
    <View style={styles.search}>
      <Feather color="#667994" name="search" size={18} />
      <TextInput
        autoFocus={autoFocus}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#667994"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    height: 44,
    paddingHorizontal: 12,
  },
  input: { color: "#092542", flex: 1, fontSize: 16, marginLeft: 8 },
});
