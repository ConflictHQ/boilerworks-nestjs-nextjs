import { gql } from "@apollo/client";

export const getEmployees = gql`
  query Employees(
    $first: Int
    $offset: Int
    $search: String
    $showDeactivated: Boolean
    $departmentName: String
    $positionName: String
  ) {
    employees(
      first: $first
      offset: $offset
      search: $search
      departmentName: $departmentName
      positionName: $positionName
      showDeactivated: $showDeactivated
    ) {
      totalCount
      edges {
        cursor
        node {
          id
          user {
            id
            firstName
            lastName
            profile {
              id
              displayName
              firstName
              lastName
              avatar {
                publicPermanentUrl
              }
            }
            email
            isActive
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;
