import { StyleSheet, View } from "react-native";
import VoiceNoteField from "../VoiceNoteField";
import { FormSection } from "../ui/FormRows";

export default function OrderNotesSection({ note, technicalNote, onChange, voice }) {
  return (
    <View style={styles.root}>
      <FormSection footer="Digite ou toque em “Gravar áudio” para ditar." title="Observações do cliente">
        <View style={styles.pad}>
          <VoiceNoteField
            field="customer"
            label="O que o cliente relatou"
            onChangeText={(value) => onChange("note", value)}
            placeholder="Ex.: não está gelando"
            value={note}
            voice={voice}
          />
        </View>
      </FormSection>
      <FormSection title="Observações técnicas">
        <View style={styles.pad}>
          <VoiceNoteField
            field="technical"
            label="Laudo e instruções internas"
            onChangeText={(value) => onChange("technicalNote", value)}
            placeholder="Ex.: trocar compressor"
            value={technicalNote}
            voice={voice}
          />
        </View>
      </FormSection>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 20 },
  pad: { padding: 12 },
});
