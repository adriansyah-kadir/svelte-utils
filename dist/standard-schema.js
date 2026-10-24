export function createStandardSchema(validate, vendor = 'custom') {
    return {
        '~standard': {
            version: 1,
            vendor,
            // The schema is declared to accept `Input`, so we trust the caller here.
            validate: validate,
        },
    };
}
