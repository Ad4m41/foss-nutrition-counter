import React from 'react';
import { Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { ClarificationQuestion, QuestionAnswers } from '../core/clarification';
import { useApp } from '../state/AppProvider';
import { feedback } from './feedback';
import { Segmented } from './Segmented';
import { Body, Button, Field, Label, fonts, useTheme } from './ui';

export function MealQuestions({
  questions,
  answers,
  onChange,
  disabled,
}: {
  questions: ClarificationQuestion[];
  answers: QuestionAnswers;
  onChange: (answers: QuestionAnswers) => void;
  disabled: boolean;
}) {
  const { t } = useApp();
  const colors = useTheme();
  const set = (id: string, value?: boolean | number | string) => {
    const next = { ...answers };
    if (value === undefined) delete next[id];
    else next[id] = value;
    onChange(next);
  };
  return (
    <View>
      <Label large>{t.aiQuestionsTitle}</Label>
      <Body>{t.aiQuestionsHelp}</Body>
      {questions.map((question) => {
        const answer = answers[question.id];
        const sliderValue =
          question.type === 'slider'
            ? typeof answer === 'number'
              ? answer
              : question.min +
                Math.floor(
                  (question.max - question.min) / (2 * question.step),
                ) *
                  question.step
            : 0;
        return (
          <View
            key={question.id}
            style={{
              paddingVertical: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
              gap: 12,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: fonts.bold,
                  fontSize: 18,
                }}
              >
                {question.prompt}
              </Text>
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: fonts.medium,
                  fontSize: 12,
                }}
              >
                {question.priority === 'recommended'
                  ? t.questionRecommended
                  : t.questionOptional}
              </Text>
            </View>
            <Body muted>{question.reason}</Body>
            {question.type === 'yesNo' && (
              <Segmented
                options={[
                  { value: 'yes', label: t.yes },
                  { value: 'no', label: t.no },
                  { value: 'unknown', label: t.dontKnow },
                ]}
                value={
                  typeof answer === 'boolean'
                    ? answer
                      ? 'yes'
                      : 'no'
                    : 'unknown'
                }
                disabled={disabled}
                onChange={(value) =>
                  set(
                    question.id,
                    value === 'unknown' ? undefined : value === 'yes',
                  )
                }
              />
            )}
            {question.type === 'slider' && (
              <View style={{ gap: 8 }}>
                <Body>
                  {typeof answer === 'number'
                    ? `${answer.toLocaleString()} ${question.unit}`
                    : t.questionUnanswered}
                </Body>
                <Slider
                  accessibilityLabel={question.prompt}
                  disabled={disabled}
                  minimumValue={question.min}
                  maximumValue={question.max}
                  step={question.step}
                  value={sliderValue}
                  onValueChange={(value) => {
                    const next = Math.round(value * 1000) / 1000;
                    if (next !== answer) feedback();
                    set(question.id, next);
                  }}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.line}
                  thumbTintColor={colors.primary}
                  style={{ width: '100%', height: 48 }}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Body muted>
                    {question.min} {question.unit}
                  </Body>
                  <Body muted>
                    {question.max} {question.unit}
                  </Body>
                </View>
                {answer === undefined && (
                  <Button
                    title={`${t.useSliderValue}: ${Math.round(sliderValue * 1000) / 1000} ${question.unit}`}
                    secondary
                    disabled={disabled}
                    onPress={() => set(question.id, sliderValue)}
                  />
                )}
              </View>
            )}
            {question.type === 'text' && (
              <Field
                label={t.yourAnswer}
                value={typeof answer === 'string' ? answer : ''}
                maxLength={1000}
                multiline
                editable={!disabled}
                onChangeText={(text) => set(question.id, text)}
              />
            )}
            {question.type !== 'yesNo' && answer !== undefined && (
              <Button
                title={t.skipQuestion}
                secondary
                disabled={disabled}
                onPress={() => set(question.id)}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
