import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";

const BUCKET = "site-notes-photos";

/**
 * Lets the user pick or capture a photo, uploads it to the
 * `site-notes-photos` Supabase Storage bucket, and returns the storage
 * path (not a public URL — the bucket is private, so callers should
 * resolve a signed URL via getSignedPhotoUrl when displaying it).
 */
export async function pickAndUploadPhoto(pathPrefix: string): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  const result = permission.granted
    ? await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true })
    : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: true });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const base64 = asset.base64;
  if (!base64) return null;

  const ext = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${pathPrefix}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, decode(base64), {
    contentType: asset.mimeType ?? `image/${ext}`,
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function getSignedPhotoUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}
