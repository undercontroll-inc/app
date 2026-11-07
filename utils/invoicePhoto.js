import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const MAX_EDGE = 2400;
const JPEG_QUALITY = 0.8;

export async function toUploadableJpeg(asset) {
  const context = ImageManipulator.manipulate(asset.uri);
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  if (Math.max(width, height) > MAX_EDGE) {
    context.resize(width >= height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return {
    uri: result.uri,
    name: `nota-${Date.now()}.jpg`,
    mimeType: "image/jpeg",
    isImage: true,
  };
}
