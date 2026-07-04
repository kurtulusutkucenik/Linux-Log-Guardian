import type { Locale } from "../locales";
import type { PipelineDeepCopy } from "./types";
import { LABELS_BY_LOCALE, LABELS_EN } from "./labels";
import { STEPS_EN, STEPS_TR } from "./steps";
import { STEPS_BY_LOCALE } from "./localeSteps";

function labelsFor(locale: Locale) {
  return LABELS_BY_LOCALE[locale] ?? LABELS_EN;
}

function stepsFor(locale: Locale) {
  if (locale === "tr") return STEPS_TR;
  if (locale === "en") return STEPS_EN;
  return STEPS_BY_LOCALE[locale] ?? STEPS_EN;
}

export function getPipelineDeep(locale: Locale): PipelineDeepCopy {
  const labels = labelsFor(locale);
  return { ...labels, steps: stepsFor(locale) };
}

export type { PipelineDeepCopy, PipelineStepDeep, PipelineDeepLabels } from "./types";
