import { gql } from "@apollo/client";

export const CREATE_WORKFLOW = gql`
  mutation CreateWorkflowDefinition(
    $name: String!
    $slug: String!
    $modelName: String!
    $states: JSON!
    $transitions: JSON!
    $description: String
    $isEnabled: Boolean
  ) {
    createWorkflowDefinition(
      name: $name
      slug: $slug
      modelName: $modelName
      states: $states
      transitions: $transitions
      description: $description
      isEnabled: $isEnabled
    ) {
      ok
      errors {
        field
        message
      }
    }
  }
`;

export const UPDATE_WORKFLOW = gql`
  mutation UpdateWorkflowDefinition(
    $slug: String!
    $name: String
    $description: String
    $modelName: String
    $states: JSON
    $transitions: JSON
    $isEnabled: Boolean
  ) {
    updateWorkflowDefinition(
      slug: $slug
      name: $name
      description: $description
      modelName: $modelName
      states: $states
      transitions: $transitions
      isEnabled: $isEnabled
    ) {
      ok
      errors {
        field
        message
      }
    }
  }
`;

export const DELETE_WORKFLOW = gql`
  mutation DeleteWorkflowDefinition($slug: String!) {
    deleteWorkflowDefinition(slug: $slug) {
      ok
      errors {
        field
        message
      }
    }
  }
`;

export const START_WORKFLOW = gql`
  mutation StartWorkflow($workflowSlug: String!, $targetModel: String!, $targetId: String!) {
    startWorkflow(workflowSlug: $workflowSlug, targetModel: $targetModel, targetId: $targetId) {
      ok
      errors {
        field
        message
      }
    }
  }
`;

export const TRANSITION_WORKFLOW = gql`
  mutation TransitionWorkflow($instanceId: ID!, $toState: String!, $note: String) {
    transitionWorkflow(instanceId: $instanceId, toState: $toState, note: $note) {
      ok
      errors {
        field
        message
      }
    }
  }
`;
