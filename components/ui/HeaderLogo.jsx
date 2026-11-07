import { Image, StyleSheet } from "react-native";

export default function HeaderLogo() {
  return (
    <Image
      accessibilityLabel="Pelluci"
      resizeMode="contain"
      source={require("../../assets/logo_pelluci.png")}
      style={styles.logo}
    />
  );
}

const styles = StyleSheet.create({
  logo: { height: 30, width: 64 },
});
