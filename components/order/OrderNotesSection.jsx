import VoiceNoteField from "../VoiceNoteField";
import { Section } from "./OrderFormParts";

export default function OrderNotesSection({ note, technicalNote, onChange, voice }) {
  return (
    <>
      <Section title="Observações do cliente">
        <VoiceNoteField
          field="customer"
          label="Informações adicionais"
          onChangeText={(value) => onChange("note", value)}
          placeholder="Digite ou grave um áudio"
          value={note}
          voice={voice}
        />
      </Section>
      <Section title="Observações técnicas">
        <VoiceNoteField
          field="technical"
          label="Laudo / instruções internas"
          onChangeText={(value) => onChange("technicalNote", value)}
          placeholder="Digite ou grave um áudio"
          value={technicalNote}
          voice={voice}
        />
      </Section>
    </>
  );
}
