import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useApp } from '../state/AppProvider';
import { AnalysisError } from '../core/nutrition';
import { ProductAnalysis, productListKeys } from '../core/product';
import { analyzeProduct } from '../services/gemini';
import { disposePhoto, pickPhoto } from '../services/photos';
import { PhotoActions } from '../components/PhotoActions';
import { confirmAction } from '../components/confirm';
import { Body, Button, Field, Label, Notice, Page } from '../components/ui';

export default function ProductScreen() {
  const { apiKey, settings, updateSettings, trackAi, t } = useApp();
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(
    null,
  );
  const [result, setResult] = useState<ProductAnalysis | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<'photo' | 'analysis' | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(
    () => () => {
      if (photo) disposePhoto(photo.uri);
    },
    [photo],
  );
  usePreventRemove(busy !== null, () => setMessage(t.pending));

  async function choosePhoto(camera: boolean) {
    if (lock.current) return;
    lock.current = true;
    setBusy('photo');
    setMessage('');
    try {
      const picked = await pickPhoto(camera);
      if (picked) {
        setPhoto({ uri: picked.uri, base64: picked.base64 ?? '' });
        setResult(null);
      }
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === 'cameraPermission'
          ? t.cameraPermission
          : t.photoError,
      );
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  async function check() {
    if (lock.current) return;
    if (!apiKey) {
      setMessage(t.productKeyMissing);
      return;
    }
    if (!description.trim() && !photo?.base64) {
      setMessage(t.productInputMissing);
      return;
    }
    lock.current = true;
    setBusy('analysis');
    setMessage('');
    controller.current = new AbortController();
    try {
      if (!settings.consent) {
        if (
          !(await confirmAction(
            t.productConsentTitle,
            t.productConsentBody,
            t.productAnalyze,
            t.cancel,
          ))
        )
          return;
        try {
          await updateSettings({ ...settings, consent: true });
        } catch {
          throw new AnalysisError('storage');
        }
      }
      const analysis = await trackAi('product', (onUsage) =>
        analyzeProduct({
          key: apiKey,
          model: settings.model,
          language: settings.language,
          base64: photo?.base64,
          description,
          signal: controller.current!.signal,
          onUsage,
        }),
      );
      setResult(analysis);
    } catch (error) {
      if (!controller.current?.signal.aborted) {
        const messages = {
          key: t.keyError,
          quota: t.quotaError,
          model: t.modelError,
          network: t.networkError,
          timeout: t.timeoutError,
          invalid: t.productInvalidError,
          noFood: t.productNoFoodError,
          server: t.serverError,
          localLimit: t.localLimitError,
          storage: t.aiStorageError,
        };
        setMessage(
          error instanceof AnalysisError
            ? messages[error.code]
            : t.analysisError,
        );
      }
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  const headings = {
    strengths: t.productStrengths,
    concerns: t.productConcerns,
    allergens: t.productAllergens,
    uncertainties: t.productUncertainties,
  };
  return (
    <Page>
      <Stack.Screen options={{ title: t.checkProduct }} />
      <Body muted>{t.productIntro}</Body>
      <View style={{ marginTop: 20 }}>
        <Field
          label={t.productDescription}
          placeholder={t.productHint}
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            setResult(null);
          }}
          multiline
          maxLength={6000}
          editable={!busy}
        />
      </View>
      {photo && (
        <>
          <Image
            source={{ uri: photo.uri }}
            accessibilityLabel={t.productPhoto}
            style={{ width: '100%', height: 220, borderRadius: 16 }}
            resizeMode="contain"
          />
          <Button
            title={t.removePhoto}
            secondary
            disabled={!!busy}
            onPress={() => {
              setPhoto(null);
              setResult(null);
            }}
          />
        </>
      )}
      <PhotoActions
        disabled={!!busy}
        onCamera={() => {
          void choosePhoto(true);
        }}
        onGallery={() => {
          void choosePhoto(false);
        }}
      />
      {message ? <Notice error text={message} /> : null}
      {!apiKey && (
        <>
          <Notice text={t.productKeyMissing} />
          <Button
            title={t.openSettings}
            secondary
            onPress={() => router.push('/settings')}
          />
        </>
      )}
      <Button
        title={busy === 'analysis' ? t.productAnalyzing : t.productAnalyze}
        icon="search-outline"
        loading={busy === 'analysis'}
        disabled={!!busy || !apiKey}
        onPress={() => {
          void check();
        }}
      />
      {busy === 'analysis' && (
        <Button
          title={t.cancel}
          secondary
          onPress={() => controller.current?.abort()}
        />
      )}
      {result && (
        <View accessibilityLiveRegion="polite">
          <Label large>{result.name}</Label>
          <Body>{result.summary}</Body>
          <Notice text={t.productEstimate} />
          {productListKeys.map((key) => (
            <View key={key}>
              <Label>{headings[key]}</Label>
              {result[key].length ? (
                result[key].map((text, index) => (
                  <View key={index} style={{ marginBottom: 10 }}>
                    <Body>{text}</Body>
                  </View>
                ))
              ) : (
                <Body muted>{t.productNoObservations}</Body>
              )}
            </View>
          ))}
          <Label>{t.productAdvice}</Label>
          <Body>{result.advice}</Body>
        </View>
      )}
    </Page>
  );
}
