export type FormDefinition = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  version: number;
  schema: Record<string, unknown>;
  formType: string;
  isPublic: boolean;
  fieldConfig: Record<string, unknown>;
  logicRules: unknown[];
  scoring: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  submissionCount: number;
};

export type FormSubmission = {
  id: string;
  payload: Record<string, unknown>;
  status: string;
  submittedAt: string;
};

export type FormDefinitionsData = {
  formDefinitions: FormDefinition[];
};

export type FormDefinitionData = {
  formDefinition: FormDefinition | null;
};

export type FormSubmissionsData = {
  formSubmissions: FormSubmission[];
};

export type MutationError = {
  field: string | null;
  message: string;
};

export type MutationResultData = {
  [key: string]: {
    ok: boolean;
    errors: MutationError[] | null;
  };
};
