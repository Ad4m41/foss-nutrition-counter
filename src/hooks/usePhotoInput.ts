import { MAX_MEAL_PHOTOS } from '../core/nutrition';
import { useEffect, useRef, useState } from 'react';
import { disposePhoto, pickPhotos, recoverPhotos } from '../services/photos';

type Photo = { uri: string; base64?: string };

/** Only photos acquired by this editor are disposable; saved photos are borrowed. */
export function usePhotoInput(initialUris: string[] = []) {
  const [photos, setPhotos] = useState<Photo[]>(() =>
    initialUris.map((uri) => ({ uri })),
  );
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'cameraPermission' | 'photoError' | null>(
    null,
  );
  const owned = useRef(new Set<string>());
  const mounted = useRef(false);
  const lock = useRef(false);
  const recovery = useRef<ReturnType<typeof recoverPhotos> | null>(null);

  function accept(next: Photo[]) {
    if (!next.length) return;
    if (!mounted.current) {
      for (const photo of next) disposePhoto(photo.uri);
      return;
    }
    for (const photo of next) owned.current.add(photo.uri);
    setPhotos((current) => [...current, ...next].slice(0, MAX_MEAL_PHOTOS));
  }

  useEffect(() => {
    mounted.current = true;
    let active = true;
    // Reuse the read across Strict Mode's effect replay: pending results are consumed.
    recovery.current ??= recoverPhotos();
    void recovery.current
      .then((next) => {
        if (active) accept(next);
        else if (!mounted.current)
          for (const photo of next) disposePhoto(photo.uri);
      })
      .catch(() => {
        if (active) setError('photoError');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    const photos = owned.current;
    return () => {
      active = false;
      mounted.current = false;
      for (const uri of photos) disposePhoto(uri);
      photos.clear();
    };
  }, []);

  // Remove replaced/cleared drafts after React stops rendering them.
  useEffect(() => {
    for (const uri of owned.current) {
      if (!photos.some((photo) => photo.uri === uri)) {
        disposePhoto(uri);
        owned.current.delete(uri);
      }
    }
  }, [photos]);

  async function choose(camera: boolean) {
    if (!ready || lock.current || photos.length >= MAX_MEAL_PHOTOS)
      return false;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await pickPhotos(camera, MAX_MEAL_PHOTOS - photos.length);
      accept(next);
      return next.length > 0;
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error && cause.message === 'cameraPermission'
            ? 'cameraPermission'
            : 'photoError',
        );
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return {
    photos,
    remove: (uri: string) =>
      setPhotos((current) => current.filter((photo) => photo.uri !== uri)),
    ready,
    busy,
    error,
    choose,
    clear: () => {
      setPhotos([]);
      setError(null);
    },
  };
}
