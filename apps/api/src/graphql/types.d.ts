export declare const MutationError: any;
export declare const MutationResult: any;
export declare function mutationOk(): {
    ok: boolean;
    errors: null;
};
export declare function mutationError(field: string | null, message: string): {
    ok: boolean;
    errors: {
        field: string | null;
        message: string;
    }[];
};
export declare function zodToMutationErrors(zodError: {
    issues: Array<{
        path: (string | number)[];
        message: string;
    }>;
}): {
    ok: boolean;
    errors: {
        field: string | null;
        message: string;
    }[];
};
//# sourceMappingURL=types.d.ts.map