import {
  GraphQLError,
  Kind,
  type ASTVisitor,
  type ValidationContext,
} from "graphql";

/**
 * Custom GraphQL validation rule that rejects queries exceeding `maxDepth`.
 * Depth is measured by the nesting of selection sets (fields within fields).
 */
export function depthLimitRule(
  maxDepth: number,
): (ctx: ValidationContext) => ASTVisitor {
  return (ctx: ValidationContext): ASTVisitor => {
    return {
      Document: {
        enter(node) {
          for (const definition of node.definitions) {
            if (
              definition.kind === Kind.OPERATION_DEFINITION ||
              definition.kind === Kind.FRAGMENT_DEFINITION
            ) {
              const depth = measureDepth(definition);
              if (depth > maxDepth) {
                ctx.reportError(
                  new GraphQLError(
                    `Query depth ${depth} exceeds maximum allowed depth of ${maxDepth}`,
                  ),
                );
              }
            }
          }
        },
      },
    };
  };
}

function measureDepth(node: any): number {
  if (!node.selectionSet) return 0;

  let max = 0;
  for (const selection of node.selectionSet.selections) {
    const childDepth = measureDepth(selection);
    if (childDepth > max) max = childDepth;
  }
  return max + 1;
}
