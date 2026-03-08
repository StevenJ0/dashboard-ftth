export const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET
);

export const JWT_RESET_SECRET = new TextEncoder().encode(
    process.env.JWT_RESET_SECRET
);
