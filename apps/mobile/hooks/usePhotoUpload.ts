import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { getPresignedUrl, confirmUpload } from '@services';

export type PhotoUploadState =
  | { status: 'idle' }
  | { status: 'picking' }
  | { status: 'uploading'; progress: number }
  // `s3Key` is the canonical reference to send to the API (confirmPickup /
  // confirmDelivery). `previewUrl` is a short-lived presigned URL for the
  // in-screen <Image> preview only — never persist it.
  | { status: 'done'; s3Key: string; previewUrl: string }
  | { status: 'error'; message: string };

/**
 * Manages the full camera → S3 upload flow for a single photo.
 * Uses ImagePicker (which wraps expo-camera on device) so no separate
 * camera permission setup is needed.
 *
 * Returns { state, pickAndUpload } — call pickAndUpload() from a Pressable.
 * On success, state.s3Url is the final CDN URL to send to the API.
 */
export function usePhotoUpload(purpose: string) {
  const [state, setState] = useState<PhotoUploadState>({ status: 'idle' });

  async function pickAndUpload() {
    setState({ status: 'picking' });

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      setState({ status: 'error', message: 'Camera permission denied' });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      setState({ status: 'idle' });
      return;
    }

    const asset = result.assets[0];
    setState({ status: 'uploading', progress: 0 });

    try {
      const { presignedUrl, s3Key } = await getPresignedUrl(purpose, asset.mimeType ?? 'image/jpeg');

      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': asset.mimeType ?? 'image/jpeg' },
        body: await uriToBlob(asset.uri),
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed: ${response.status}`);
      }

      setState({ status: 'uploading', progress: 100 });
      const { s3Key: confirmedKey, url } = await confirmUpload(s3Key);
      setState({ status: 'done', s3Key: confirmedKey, previewUrl: url });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  }

  return { state, pickAndUpload };
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}
