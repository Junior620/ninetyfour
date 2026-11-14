import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { request } from "./api";

/**
 * Portrait of a player: taken on site or chosen from the library, square crop, then
 * reduced on the phone (1200 px, JPEG) so it stays under the server's 5 MB limit.
 * The server decodes it again, strips the metadata and checks the consent.
 */
export async function pickPortrait(source: "camera" | "library"): Promise<string | null> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error(
    source === "camera"
      ? "Accès à l’appareil photo refusé. Autorisez-le dans Réglages › N91 MatchLab."
      : "Accès aux photos refusé. Autorisez-le dans Réglages › N91 MatchLab.",
  );
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    exif: false,
    cameraType: ImagePicker.CameraType.back,
  };
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 1200)
    context.resize(asset.width >= asset.height ? { width: 1200, height: null } : { width: null, height: 1200 });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return saved.uri;
}

export async function uploadPortrait(playerId: string, consentId: string, uri: string) {
  const form = new FormData();
  form.append("player_id", playerId);
  form.append("consent_id", consentId);
  form.append("purpose", "photo");
  // Expo's fetch (SDK 58) no longer sends React Native's { uri } parts: the part must
  // provide its bytes. Name and type are explicit; the server checks image/jpeg.
  const file = new File(uri);
  form.append("file", {
    name: "portrait.jpg",
    type: "image/jpeg",
    bytes: () => file.bytes(),
  } as unknown as Blob);
  return request<{ id: string }>("/api/matchlab/media", { form });
}
