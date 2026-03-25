import { gql } from "@apollo/client";

export const GET_FORM_DEFINITIONS = gql`
  query GetFormDefinitions($status: String) {
    formDefinitions(status: $status) {
      id
      name
      slug
      description
      status
      version
      formType
      isPublic
      publishedAt
      createdAt
      updatedAt
      submissionCount
    }
  }
`;

export const GET_FORM_DEFINITION = gql`
  query GetFormDefinition($slug: String!) {
    formDefinition(slug: $slug) {
      id
      name
      slug
      description
      status
      version
      schema
      formType
      isPublic
      fieldConfig
      logicRules
      scoring
      publishedAt
      createdAt
      updatedAt
      submissionCount
    }
  }
`;

export const GET_FORM_SUBMISSIONS = gql`
  query GetFormSubmissions($formId: String!) {
    formSubmissions(formId: $formId) {
      id
      payload
      status
      submittedAt
    }
  }
`;
