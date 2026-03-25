import { gql } from "@apollo/client";

export const GET_WORKFLOWS = gql`
  query GetWorkflows($modelName: String) {
    workflowDefinitions(modelName: $modelName) {
      id
      name
      slug
      description
      modelName
      isEnabled
      createdAt
      instanceCount
    }
  }
`;

export const GET_WORKFLOW = gql`
  query GetWorkflow($slug: String!) {
    workflowDefinition(slug: $slug) {
      id
      name
      slug
      description
      modelName
      states
      transitions
      isEnabled
      createdAt
      instanceCount
    }
  }
`;
