export type PipelineStepDeep = {
  what: string;
  advantages: string[];
  lg: string;
  rivals: string;
  proof?: string;
};

export type PipelineDeepLabels = {
  sectionEyebrow: string;
  sectionTitle: string;
  sectionSub: string;
  whatLabel: string;
  advantagesLabel: string;
  compareLabel: string;
  lgLabel: string;
  rivalsLabel: string;
};

export type PipelineDeepCopy = PipelineDeepLabels & {
  steps: PipelineStepDeep[];
};
