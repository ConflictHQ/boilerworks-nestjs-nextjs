import { gql } from "@apollo/client";

export const CREATE_FORM_DEFINITION = gql`
  mutation CreateFormDefinition(
    $name: String!
    $slug: String!
    $description: String
    $formType: String
    $isPublic: Boolean
    $schema: JSON
    $fieldConfig: JSON
    $logicRules: JSON
  ) {
    createFormDefinition(
      name: $name
      slug: $slug
      description: $description
      formType: $formType
      isPublic: $isPublic
      schema: $schema
      fieldConfig: $fieldConfig
      logicRules: $logicRules
    ) {
      ok
      errors {
        field
        message
      }
    }
  }
`;

export const UPDATE_FORM_DEFINITION = gql`
  mutation UpdateFormDefinition(
    $id: String!
    $name: String
    $description: String
    $schema: JSON
    $fieldConfig: JSON
    $logicRules: JSON
    $isPublic: Boolean
  ) {
    updateFormDefinition(
      id: $id
      name: $name
      description: $description
      schema: $schema
      fieldConfig: $fieldConfig
      logicRules: $logicRules
      isPublic: $isPublic
    ) {
      ok
      errors {
        field
        message
      }
    }
  }
`;

export const PUBLISH_FORM = gql`
  mutation PublishFormDefinition($id: String!) {
    publishFormDefinition(id: $id) {
      ok
      errors {
        field
        message
      }
    }
  }
`;

export const ARCHIVE_FORM = gql`
  mutation ArchiveFormDefinition($id: String!) {
    archiveFormDefinition(id: $id) {
      ok
      errors {
        field
        message
      }
    }
  }
`;

export const SUBMIT_FORM = gql`
  mutation SubmitForm($formId: String!, $payload: JSON!) {
    submitForm(formId: $formId, payload: $payload) {
      ok
      errors {
        field
        message
      }
    }
  }
`;
