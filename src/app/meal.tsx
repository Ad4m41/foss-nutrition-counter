import React, { useEffect, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useNavigation, usePreventRemove } from 'expo-router/react-navigation';
import { randomUUID } from 'expo-crypto';
import {
  AnalysisError,
  Analysis,
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
import {
  ClarificationQuestion,
  MealClarification,
  QuestionAnswers,
  hasQuestionAnswers,
} from '../core/clarification';
import { MealQuestions } from '../components/MealQuestions';
import { PhotoActions } from '../components/PhotoActions';
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
  const params = useLocalSearchParams<{
    id?: string;
    day?: string;
    capture?: string;
    mode?: string;
  }>();
  const {
    meals,
    apiKey,
    settings,
    t,
    saveMeal,
    deleteMeal,
    updateSettings,
    trackAi,
  } = useApp();
  const colors = useTheme();
  const navigation = useNavigation();
  const original = meals.find((item) => item.id === params.id);
  const [phase, setPhase] = useState<'input' | 'questions' | 'review'>(() =>
    original || params.mode === 'manual' ? 'review' : 'input',
  );
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswers>({});
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
  const autoCamera = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const [message, setMessage] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const snapshot = JSON.stringify({
    name,
    day,
    ingredients,
    notes,
    source,
    photoUri,
    description,
    questions,
    answers,
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
  useEffect(() => {
    if (params.capture === 'camera' && !original && !autoCamera.current) {
      autoCamera.current = true;
      void photo(true);
    }
    // Launch the camera once for the explicit add-from-camera action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.capture]);
  async function analyze(clarification?: MealClarification) {
    if (lock.current) return;
    if (!apiKey) {
      setMessage(t.keyMissing);
      return;
    }
    if (!photoData && !description.trim()) {
      setMessage(t.mealInputMissing);
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
        try {
          await updateSettings({ ...settings, consent: true });
        } catch {
          throw new AnalysisError('storage');
        }
      }
      if (
        !clarification &&
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
      const result = await trackAi('meal', (onUsage) =>
        analyzePhoto({
          key: apiKey,
          model: settings.model,
          base64: photoData || undefined,
          description,
          language: settings.language,
          signal: controller.current!.signal,
          onUsage,
          clarification,
        }),
      );
      applyEstimate(result);
      const followUpQuestions = clarification ? [] : (result.questions ?? []);
      setQuestions(followUpQuestions);
      setAnswers({});
      setPhase(followUpQuestions.length ? 'questions' : 'review');
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
          localLimit: t.localLimitError,
          storage: t.aiStorageError,
        };
        setMessage(code ? messages[code] : t.analysisError);
      }
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  function applyEstimate(result: Analysis) {
    setName(result.name);
    setIngredients(result.ingredients.map(toDraft));
    setNotes(result.notes);
    setSource('ai');
  }
  function skipQuestions() {
    setMessage('');
    setNotes((current) =>
      [current, t.questionsSkippedNote].filter(Boolean).join('\n'),
    );
    setQuestions([]);
    setAnswers({});
    setPhase('review');
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
    <Page
      footer={
        phase === 'questions' ? (
          <View>
            <Button
              title={
                busy === 'analysis' ? t.refiningEstimate : t.refineEstimate
              }
              loading={busy === 'analysis'}
              disabled={!!busy || !hasQuestionAnswers(answers)}
              icon="sparkles-outline"
              onPress={() => {
                void analyze({ questions, answers });
              }}
            />
            <Button
              title={t.skipQuestions}
              secondary
              disabled={!!busy}
              onPress={skipQuestions}
            />
          </View>
        ) : phase === 'input' ? (
          <Button
            title={busy === 'analysis' ? t.analyzing : t.analyze}
            loading={busy === 'analysis'}
            disabled={!!busy || !apiKey}
            icon="sparkles-outline"
            onPress={() => {
              void analyze();
            }}
          />
        ) : (
          <Button
            title={t.save}
            loading={busy === 'save'}
            disabled={!!busy}
            icon="checkmark"
            onPress={() => {
              void save();
            }}
          />
        )
      }
    >
      <Stack.Screen options={{ title: original ? t.editMeal : t.addMeal }} />
      {!original &&
        phase !== 'questions' &&
        (phase === 'input' || source === 'manual') && (
          <>
            <Body>{t.aiMealIntro}</Body>
            <View style={{ marginTop: 12, marginBottom: 16 }}>
              <Body muted>
                {new Date(`${day}T12:00:00`).toLocaleDateString(
                  settings.language,
                )}
              </Body>
            </View>
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
            <PhotoActions
              disabled={!!busy}
              onCamera={() => {
                void photo(true);
              }}
              onGallery={() => {
                void photo(false);
              }}
            />
            <View style={{ marginTop: 16 }}>
              <Field
                label={t.mealDescription}
                placeholder={t.mealDescriptionHint}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={6000}
                editable={!busy}
              />
              {phase === 'review' && (
                <Button
                  title={busy === 'analysis' ? t.analyzing : t.analyze}
                  icon="sparkles-outline"
                  loading={busy === 'analysis'}
                  disabled={!!busy || !apiKey}
                  onPress={() => {
                    void analyze();
                  }}
                />
              )}
              {phase === 'input' && (
                <Button
                  title={t.manual}
                  secondary
                  disabled={!!busy}
                  icon="create-outline"
                  onPress={() => setPhase('review')}
                />
              )}
            </View>
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
      {message ? <Notice error text={message} /> : null}
      {busy === 'analysis' && (
        <Button
          title={t.cancel}
          secondary
          onPress={() => controller.current?.abort()}
        />
      )}
      {phase === 'questions' && (
        <MealQuestions
          questions={questions}
          answers={answers}
          onChange={setAnswers}
          disabled={!!busy}
        />
      )}
      {phase === 'review' && source === 'ai' && !original && photoUri && (
        <Image
          source={{ uri: photoUri }}
          accessibilityLabel={t.photo}
          style={{ width: '100%', height: 180, borderRadius: 16 }}
        />
      )}
      {original?.photoUri && (
        <Image
          source={{ uri: original.photoUri }}
          accessibilityLabel={t.photo}
          style={{ width: '100%', height: 180, borderRadius: 16 }}
        />
      )}
      {phase === 'review' && (
        <View>
          {source === 'ai' ? (
            <Notice text={t.estimate} />
          ) : (
            <Label>{t.manual}</Label>
          )}
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
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
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
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  columnGap: 12,
                }}
              >
                {(['grams', ...requiredNutrientKeys] as const).map((key) => (
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
                      keyboardType="decimal-pad"
                      onChangeText={(text) =>
                        changeIngredient(index, key, text)
                      }
                      editable={!busy}
                    />
                  </View>
                ))}
              </View>
              <Button
                title={expanded[item.id] ? t.lessNutrition : t.moreNutrition}
                expanded={!!expanded[item.id]}
                disabled={!!busy}
                secondary
                icon={expanded[item.id] ? 'chevron-up' : 'chevron-down'}
                onPress={() =>
                  setExpanded((current) => ({
                    ...current,
                    [item.id]: !current[item.id],
                  }))
                }
              />
              {expanded[item.id] && (
                <View style={{ paddingTop: 16 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      columnGap: 12,
                    }}
                  >
                    {additionalNutrientKeys.map((key) => (
                      <View
                        key={key}
                        style={{ minWidth: 120, flexGrow: 1, flexBasis: '43%' }}
                      >
                        <Field
                          label={`${t[key]} (g)`}
                          value={item[key]}
                          placeholder={t.unknown}
                          keyboardType="decimal-pad"
                          onChangeText={(text) =>
                            changeIngredient(index, key, text)
                          }
                          editable={!busy}
                        />
                      </View>
                    ))}
                  </View>
                  <Body muted>{t.unknownHelp}</Body>
                  <View style={{ marginTop: 12 }}>
                    <Button
                      title={t.lessNutrition}
                      secondary
                      icon="chevron-up"
                      onPress={() =>
                        setExpanded((current) => ({
                          ...current,
                          [item.id]: false,
                        }))
                      }
                    />
                  </View>
                </View>
              )}
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
              <Text
                style={{ color: colors.muted, fontSize: 15, lineHeight: 23 }}
              >
                {notes}
              </Text>
            </>
          ) : null}
          <View style={{ marginTop: 24 }}>
            <Nutrition value={sum} heading={t.summary} />
          </View>
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
        </View>
      )}
    </Page>
  );
}
