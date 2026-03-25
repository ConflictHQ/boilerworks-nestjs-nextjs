import { gql } from "@apollo/client";

export const GET_ME = gql`
  query Me {
    me {
      id
      email
      name
      isSuperuser
      isStaff
    }
  }
`;

export const GET_USERS = gql`
  query Users {
    users {
      id
      email
      name
      isActive
      createdAt
    }
  }
`;
