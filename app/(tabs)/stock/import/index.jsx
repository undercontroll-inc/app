import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Icon from "../../../../components/Icon";
import Banner from "../../../../components/stock-import/Banner";
import Button from "../../../../components/stock-import/Button";
import { headerButtonOptions } from "../../../../components/ui/headerItems";
import ScanPreview from "../../../../components/stock-import/ScanPreview";
import StepIndicator from "../../../../components/stock-import/StepIndicator";
import StickyFooter from "../../../../components/stock-import/StickyFooter";
import { colors, radius, shadow } from "../../../../components/stock-import/theme";
import { usePendingStockImports, useUploadStockImport } from "../../../../hooks/queries/useStockImports";
import { closeImportFlow } from "../../../../hooks/useCancelImportPrompt";
import { stockImportErrorMessage } from "../../../../services/StockImportService";
import { haptics } from "../../../../utils/haptics";
import { toUploadableJpeg } from "../../../../utils/invoicePhoto";
import { ACCEPTED_DOCUMENT_TYPES, formatBRL, formatIssueDate } from "../../../../utils/stockImport";

const IMAGE_OPTIONS = { mediaTypes: ["images"], quality: 0.85, allowsEditing: false, exif: false };

function SourceTile({ sf, feather, label, onPress, testID }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      testID={testID}
    >
      <Icon color={colors.navy} feather={feather} sf={sf} size={20} />
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

function PendingImports() {
  const { data } = usePendingStockImports();
  const pending = data ?? [];
  if (!pending.length) return null;
  const latest = pending[0];
  const details = [latest.supplierName, formatIssueDate(latest.issuedAt), `${latest.itemCount} itens`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={() => router.push(`/stock/import/${latest.id}/review`)}
      style={({ pressed }) => [styles.pending, pressed && styles.pressed]}
    >
      <View style={styles.pendingIcon}>
        <Icon color={colors.orange} feather="clock" sf="clock.arrow.circlepath" size={18} />
      </View>
      <View style={styles.pendingBody}>
        <Text style={styles.pendingTitle}>
          {pending.length === 1 ? "1 nota aguardando revisão" : `${pending.length} notas aguardando revisão`}
        </Text>
        <Text numberOfLines={1} style={styles.pendingMeta}>
          {details}
          {latest.total != null ? ` · ${formatBRL(latest.total)}` : ""}
        </Text>
      </View>
      <Icon color={colors.subtle} feather="chevron-right" sf="chevron.right" size={14} />
    </Pressable>
  );
}

export default function ImportUploadScreen() {
  const [file, setFile] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const upload = useUploadStockImport();

  async function takePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Câmera bloqueada", "Permita o acesso à câmera para fotografar a nota.", [
          { text: "Agora não", style: "cancel" },
          { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      const result = await ImagePicker.launchCameraAsync(IMAGE_OPTIONS);
      if (!result.canceled && result.assets?.[0]) await selectPhoto(result.assets[0]);
    } catch {
      Alert.alert("Câmera indisponível", "Não foi possível abrir a câmera neste dispositivo. Escolha da galeria.");
    }
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync(IMAGE_OPTIONS);
    if (!result.canceled && result.assets?.[0]) await selectPhoto(result.assets[0]);
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({ type: ACCEPTED_DOCUMENT_TYPES, copyToCacheDirectory: true });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    select({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, isImage: false });
  }

  async function selectPhoto(asset) {
    setPreparing(true);
    try {
      select(await toUploadableJpeg(asset));
    } catch {
      Alert.alert("Foto inválida", "Não foi possível preparar esta foto. Tente outra.");
    } finally {
      setPreparing(false);
    }
  }

  function select(next) {
    haptics.selection();
    upload.reset();
    setFile(next);
  }

  function analyze() {
    if (!file) return;
    upload.mutate(file, {
      onSuccess: (dto) => {
        haptics.light();
        router.push({
          pathname: "/stock/import/[importId]/analyzing",
          params: {
            importId: String(dto.id),
            previewUri: file.uri,
            fileName: file.name,
            isImage: file.isImage ? "1" : "0",
          },
        });
      },
      onError: () => haptics.error(),
    });
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={headerButtonOptions({ label: "Fechar", onPress: closeImportFlow })} />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <StepIndicator step={0} />
        <Text style={styles.lead}>
          A IA identifica produtos, quantidades e preços. Você revisa tudo antes de qualquer mudança no estoque.
        </Text>

        <PendingImports />

        {file ? (
          <View style={styles.previewCard}>
            <ScanPreview
              fileName={file.name}
              height={300}
              isImage={file.isImage}
              scanning={false}
              uri={file.uri}
              width={236}
            />
            <View style={styles.previewMeta}>
              <Icon color={colors.success} feather="check-circle" sf="checkmark.circle.fill" size={16} />
              <Text numberOfLines={1} style={styles.previewText}>
                {file.isImage ? "Foto pronta para análise" : file.name}
              </Text>
            </View>
            <Button label="Trocar arquivo" onPress={() => setFile(null)} variant="plain" />
          </View>
        ) : (
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Icon color={colors.orange} feather="camera" sf="doc.viewfinder" size={30} />
            </View>
            <Text style={styles.heroTitle}>Fotografe a nota fiscal</Text>
            <Text style={styles.heroText}>Enquadre a nota inteira, com boa luz e sem reflexos.</Text>
            <Button
              icon={{ sf: "camera.fill", feather: "camera" }}
              label="Tirar foto"
              onPress={takePhoto}
              style={styles.heroButton}
              testID="import-take-photo"
            />
            <View style={styles.tiles}>
              <SourceTile
                feather="image"
                label="Galeria"
                onPress={pickFromLibrary}
                sf="photo.on.rectangle"
                testID="import-gallery"
              />
              <SourceTile
                feather="file-text"
                label="PDF ou XML"
                onPress={pickDocument}
                sf="doc.text"
                testID="import-document"
              />
            </View>
          </View>
        )}

        {upload.isError ? (
          <Banner message={stockImportErrorMessage(upload.error)} title="Não foi possível enviar" tone="danger" />
        ) : null}

        <View style={styles.privacy}>
          <Icon color={colors.subtle} feather="lock" sf="lock.fill" size={13} />
          <Text style={styles.privacyText}>O arquivo é usado apenas para extrair os dados desta entrada.</Text>
        </View>
      </ScrollView>
      <StickyFooter>
        <Button
          disabled={!file}
          label="Analisar nota"
          loading={upload.isPending || preparing}
          onPress={analyze}
          testID="import-analyze"
        />
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 20, padding: 20, paddingBottom: 32 },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  hero: {
    ...shadow,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    marginBottom: 6,
    width: 72,
  },
  heroTitle: { color: colors.navy, fontSize: 20, fontWeight: "800" },
  heroText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  heroButton: { alignSelf: "stretch", marginTop: 10 },
  tiles: { alignSelf: "stretch", flexDirection: "row", gap: 10 },
  tile: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.control,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
  },
  tileLabel: { color: colors.navy, fontSize: 15, fontWeight: "600" },
  previewCard: { alignItems: "center", gap: 14, paddingTop: 4 },
  previewMeta: { alignItems: "center", flexDirection: "row", gap: 6, maxWidth: "90%" },
  previewText: { color: colors.navy, fontSize: 14, fontWeight: "600" },
  pending: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  pendingIcon: {
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  pendingBody: { flex: 1, gap: 2 },
  pendingTitle: { color: colors.navy, fontSize: 15, fontWeight: "700" },
  pendingMeta: { color: colors.muted, fontSize: 13 },
  privacy: { alignItems: "center", flexDirection: "row", gap: 6, justifyContent: "center" },
  privacyText: { color: colors.subtle, fontSize: 12 },
  pressed: { opacity: 0.7 },
});
