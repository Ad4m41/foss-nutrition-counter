import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, Stack } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useApp } from '../state/AppProvider';
import { AnalysisError, MAX_MEAL_PHOTOS } from '../core/nutrition';
import { ProductAnalysis, productListKeys } from '../core/product';
import { analyzeProduct } from '../services/gemini';
import { usePhotoInput } from '../hooks/usePhotoInput';
import { PhotoGallery } from '../components/PhotoGallery';
import { PhotoActions } from '../components/PhotoActions';
import { confirmAction } from '../components/confirm';
import {
  Body,
  Button,
  Field,
  Label,
  Notice,
  Nutrition,
  Page,
} from '../components/ui';

export default function ProductScreen() {
  const { apiKey, settings, updateSettings, trackAi, t } = useApp();
  const [description, setDescription] = useState('');
  const photoInput = usePhotoInput();
  const photos = photoInput.photos;
  const [result, setResult] = useState<ProductAnalysis | null>(null);
  const [message, setMessage] = useState('');
  const [operation, setBusy] = useState<'analysis' | null>(null);
  const busy = !photoInput.ready || photoInput.busy ? 'photo' : operation;
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  usePreventRemove(busy !== null, () => setMessage(t.pending));

  async function choosePhoto(camera: boolean) {
    if (lock.current || busy === 'photo') return;
    setMessage('');
    if (await photoInput.choose(camera)) setResult(null);
  }
  async function check() {
    if (lock.current || busy === 'photo') return;
    if (!apiKey) {
      setMessage(t.productKeyMissing);
      return;
    }
    if (!description.trim() && !photos.length) {
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
          images: photos.map((photo) => photo.base64!),
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
      <PhotoGallery
        uris={photos.map((photo) => photo.uri)}
        label={t.productPhoto}
        disabled={!!busy}
        onRemove={(uri) => {
          photoInput.remove(uri);
          setResult(null);
        }}
      />
      <Body muted>
        {t.multiplePhotosHelp} ({photos.length}/{MAX_MEAL_PHOTOS})
      </Body>
      <PhotoActions
        disabled={!!busy || photos.length >= MAX_MEAL_PHOTOS}
        onCamera={() => {
          void choosePhoto(true);
        }}
        onGallery={() => {
          void choosePhoto(false);
        }}
      />
      {message || photoInput.error ? (
        <Notice error text={message || t[photoInput.error!]} />
      ) : null}
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
          <View style={{ marginTop: 12, marginBottom: 24, gap: 8 }}>
            <Label>{t.productNutrition}</Label>
            {result.nutrition ? (
              <>
                <Body muted>{result.nutrition.basis}</Body>
                <Body muted>
                  {result.nutrition.source === 'label'
                    ? t.productNutritionLabel
                    : t.productNutritionEstimate}
                </Body>
                <Nutrition value={result.nutrition.values} />
              </>
            ) : (
              <Body muted>{t.productNutritionMissing}</Body>
            )}
          </View>
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
