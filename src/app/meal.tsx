import React, { useEffect, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useNavigation, usePreventRemove } from 'expo-router/react-navigation';
import { randomUUID } from 'expo-crypto';
import {
  AnalysisError,
  Ingredient,
  localDay,
  Meal,
  Nutrients,
  newIngredient,
  nutrientKeys,
  requiredNutrientKeys,
  additionalNutrientKeys,
  parseNumber,
  resizePortion,
  totals,
  validDay,
  validIngredient,
} from '../core/nutrition';
import { useApp } from '../state/AppProvider';
import {
  Body,
  Button,
  Field,
  IconButton,
  Label,
  Notice,
  Nutrition,
  Page,
  useTheme,
} from '../components/ui';
import { confirmAction } from '../components/confirm';
import { disposePhoto, pickPhoto } from '../services/photos';
import { analyzePhoto } from '../services/gemini';
type DraftIngredient = {
  baseGrams: number;
  id: string;
  name: string;
  grams: string;
} & Record<(typeof nutrientKeys)[number], string>;
const toDraft = (item: Ingredient): DraftIngredient => ({
  baseGrams: item.grams,
  id: item.id,
  name: item.name,
  grams: String(item.grams),
  ...(Object.fromEntries(
    nutrientKeys.map((key) => [
      key,
      item[key] == null ? '' : String(item[key]),
    ]),
  ) as Record<(typeof nutrientKeys)[number], string>),
});
const toIngredient = (item: DraftIngredient): Ingredient => ({
  id: item.id,
  name: item.name.trim(),
  grams: parseNumber(item.grams),
  kcal: parseNumber(item.kcal),
  protein: parseNumber(item.protein),
  fat: parseNumber(item.fat),
  carbs: parseNumber(item.carbs),
  ...Object.fromEntries(
    additionalNutrientKeys.map((key) => [
      key,
      item[key].trim() ? parseNumber(item[key]) : null,
    ]),
  ),
});
export default function MealScreen() {
  const params = useLocalSearchParams<{ id?: string; day?: string }>();
  const { meals, apiKey, settings, t, saveMeal, deleteMeal, updateSettings } =
    useApp();
  const colors = useTheme();
  const navigation = useNavigation();
  const original = meals.find((item) => item.id === params.id);
  const [id] = useState(() => original?.id ?? randomUUID());
  const [name, setName] = useState(original?.name ?? '');
  const [day, setDay] = useState(
    original?.day ??
      (params.day && validDay(params.day) ? params.day : localDay()),
  );
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    () =>
      original?.ingredients.map(toDraft) ?? [
        toDraft(newIngredient(randomUUID())),
      ],
  );
  const [notes, setNotes] = useState(original?.notes ?? '');
  const [source, setSource] = useState<Meal['source']>(
    original?.source ?? 'manual',
  );
  const [photoUri, setPhotoUri] = useState(original?.photoUri);
  const [photoData, setPhotoData] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState<'photo' | 'analysis' | 'save' | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const [message, setMessage] = useState('');
  const [leaving, setLeaving] = useState(false);
  const snapshot = JSON.stringify({
    name,
    day,
    ingredients,
    notes,
    source,
    photoUri,
    description,
  });
  const [initial] = useState(snapshot);
  const dirty = initial !== snapshot;
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(
    () => () => {
      if (photoUri && photoUri !== original?.photoUri) disposePhoto(photoUri);
    },
    [photoUri, original?.photoUri],
  );
  useEffect(() => {
    if (leaving) {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    }
  }, [leaving]);
  usePreventRemove(!leaving && (dirty || busy !== null), async ({ data }) => {
    if (lock.current) {
      setMessage(t.pending);
      return;
    }
    if (await confirmAction(t.unsaved, t.discardBody, t.discard, t.cancel))
      navigation.dispatch(data.action);
  });
  function changeIngredient(
    index: number,
    key: 'name' | 'grams' | keyof Nutrients,
    text: string,
  ) {
    setIngredients((current) =>
      current.map((item, i) => {
        if (i !== index) return item;
        if (key === 'grams') {
          const next = parseNumber(text);
          const previous = { ...toIngredient(item), grams: item.baseGrams };
          if (
            Number.isFinite(next) &&
            next > 0 &&
            validIngredient({ ...previous, name: previous.name || '_' })
          ) {
            const scaled = toDraft(resizePortion(previous, next));
            return { ...scaled, grams: text };
          }
        }
        return { ...item, [key]: text };
      }),
    );
  }
  async function photo(camera: boolean) {
    if (lock.current) return;
    lock.current = true;
    setBusy('photo');
    setMessage('');
    try {
      const result = await pickPhoto(camera);
      if (result) {
        setPhotoUri(result.uri);
        setPhotoData(result.base64 ?? '');
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
  async function analyze() {
    if (lock.current) return;
    if (!apiKey) {
      setMessage(t.keyMissing);
      return;
    }
    if (!photoData) {
      setMessage(t.noPhoto);
      return;
    }
    lock.current = true;
    controller.current = null;
    try {
      if (!settings.consent) {
        if (
          !(await confirmAction(
            t.consentTitle,
            t.consentBody,
            t.allow,
            t.cancel,
          ))
        )
          return;
        await updateSettings({ ...settings, consent: true });
      }
      if (
        ingredients.some((item) => item.name.trim()) &&
        !(await confirmAction(
          t.analyze,
          t.replaceIngredientsBody,
          t.analyze,
          t.cancel,
        ))
      )
        return;
      setBusy('analysis');
      setMessage('');
      controller.current = new AbortController();
      const result = await analyzePhoto({
        key: apiKey,
        model: settings.model,
        base64: photoData,
        description,
        language: settings.language,
        signal: controller.current.signal,
      });
      setName(result.name);
      setIngredients(result.ingredients.map(toDraft));
      setNotes(result.notes);
      setSource('ai');
    } catch (error) {
      if (!controller.current?.signal.aborted) {
        const code = error instanceof AnalysisError ? error.code : null;
        const messages = {
          key: t.keyError,
          quota: t.quotaError,
          model: t.modelError,
          network: t.networkError,
          timeout: t.timeoutError,
          invalid: t.invalidError,
          noFood: t.noFoodError,
          server: t.serverError,
        };
        setMessage(code ? messages[code] : t.storageError);
      }
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  async function save() {
    if (lock.current) return;
    const parsed = ingredients.map(toIngredient);
    if (
      !name.trim() ||
      !validDay(day) ||
      !parsed.length ||
      !parsed.every(validIngredient)
    ) {
      setMessage(t.invalidForm);
      return;
    }
    lock.current = true;
    setBusy('save');
    setMessage('');
    try {
      await saveMeal({
        id,
        name: name.trim(),
        day,
        ingredients: parsed,
        notes,
        source,
        photoUri,
        createdAt: original?.createdAt ?? new Date().toISOString(),
      });
      setLeaving(true);
    } catch {
      setMessage(t.storageError);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  async function remove() {
    if (
      !original ||
      lock.current ||
      !(await confirmAction(t.delete, t.deleteBody, t.delete, t.cancel, true))
    )
      return;
    lock.current = true;
    setBusy('save');
    try {
      await deleteMeal(original);
      setLeaving(true);
    } catch {
      setMessage(t.storageError);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  const sum = totals(
    ingredients
      .map(toIngredient)
      .map(
        (item) =>
          Object.assign(
            {},
            item,
            Object.fromEntries(
              requiredNutrientKeys.map((key) => [
                key,
                Number.isFinite(item[key]) ? item[key] : 0,
              ]),
            ),
          ) as Nutrients,
      ),
  );
  if (params.id && !original && !leaving)
    return (
      <Page>
        <Notice text={t.notFound} />
        <Button title={t.diary} onPress={() => router.replace('/')} />
      </Page>
    );
  return (
    <Page>
      <Stack.Screen options={{ title: original ? t.editMeal : t.addMeal }} />
      {!original && (
        <>
          {photoUri && (
            <Image
              source={{ uri: photoUri }}
              accessibilityLabel={t.photo}
              style={{
                width: '100%',
                height: 220,
                borderRadius: 16,
                marginBottom: 16,
              }}
            />
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Button
              title={t.camera}
              icon="camera-outline"
              secondary
              disabled={!!busy}
              onPress={() => {
                void photo(true);
              }}
            />
            <Button
              title={t.gallery}
              icon="images-outline"
              secondary
              disabled={!!busy}
              onPress={() => {
                void photo(false);
              }}
            />
          </View>
          {photoUri && (
            <View style={{ marginTop: 16 }}>
              <Field
                label={t.description}
                placeholder={t.descriptionHint}
                value={description}
                onChangeText={setDescription}
                multiline
                editable={!busy}
              />
              <Button
                title={busy === 'analysis' ? t.analyzing : t.analyze}
                icon="sparkles-outline"
                loading={busy === 'analysis'}
                disabled={!!busy || !photoData}
                onPress={() => {
                  void analyze();
                }}
              />
              {busy === 'analysis' && (
                <Button
                  title={t.cancel}
                  secondary
                  onPress={() => controller.current?.abort()}
                />
              )}
            </View>
          )}
          {!apiKey && (
            <>
              <Body muted>{t.keyMissing}</Body>
              <Button
                title={t.openSettings}
                secondary
                disabled={!!busy}
                onPress={() => router.push('/settings')}
              />
            </>
          )}
        </>
      )}
      {original?.photoUri && (
        <Image
          source={{ uri: original.photoUri }}
          accessibilityLabel={t.photo}
          style={{ width: '100%', height: 180, borderRadius: 16 }}
        />
      )}
      {source === 'ai' ? (
        <Notice text={t.estimate} />
      ) : (
        <Label>{t.manual}</Label>
      )}
      {message ? <Notice error text={message} /> : null}
      <Field
        label={t.name}
        value={name}
        onChangeText={setName}
        editable={!busy}
      />
      <Field
        label={t.date}
        value={day}
        onChangeText={setDay}
        placeholder={t.dateHint}
        autoCapitalize="none"
        maxLength={10}
        editable={!busy}
      />
      <Label>{t.ingredients}</Label>
      <Body muted>{t.amountHelp}</Body>
      <Body muted>{t.unknownHelp}</Body>
      {ingredients.map((item, index) => (
        <View
          key={item.id}
          style={{
            paddingTop: 20,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.line,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Field
              label={t.ingredient}
              value={item.name}
              onChangeText={(text) => changeIngredient(index, 'name', text)}
              editable={!busy}
            />
            <IconButton
              label={t.removeIngredient}
              icon="trash-outline"
              disabled={!!busy}
              onPress={() =>
                setIngredients((current) =>
                  current.filter((_, i) => i !== index),
                )
              }
            />
          </View>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 }}
          >
            {(['grams', ...nutrientKeys] as const).map((key) => (
              <View
                key={key}
                style={{ minWidth: 120, flexGrow: 1, flexBasis: '43%' }}
              >
                <Field
                  label={
                    key === 'grams'
                      ? t.grams
                      : key === 'kcal'
                        ? t.kcal
                        : `${t[key]} (g)`
                  }
                  value={item[key]}
                  placeholder={
                    additionalNutrientKeys.some((nutrient) => nutrient === key)
                      ? t.unknown
                      : undefined
                  }
                  keyboardType="decimal-pad"
                  onChangeText={(text) => changeIngredient(index, key, text)}
                  editable={!busy}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
      <Button
        title={t.addIngredient}
        secondary
        icon="add"
        disabled={!!busy}
        onPress={() =>
          setIngredients((current) => [
            ...current,
            toDraft(newIngredient(randomUUID())),
          ])
        }
      />
      {notes ? (
        <>
          <Label>{t.notes}</Label>
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 23 }}>
            {notes}
          </Text>
        </>
      ) : null}
      <Nutrition value={sum} heading={t.summary} />
      <Button
        title={t.save}
        loading={busy === 'save'}
        disabled={!!busy}
        icon="checkmark"
        onPress={() => {
          void save();
        }}
      />
      {original && (
        <Button
          title={t.delete}
          danger
          disabled={!!busy}
          icon="trash-outline"
          onPress={() => {
            void remove();
          }}
        />
      )}
    </Page>
  );
}
