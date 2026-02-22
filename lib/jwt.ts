import jwt from "jsonwebtoken";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return secret;
}

export const signToken = (payload: object, expiresIn: string | number) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, getSecret(), {
    expiresIn: expiresIn as any,
    algorithm: "HS256",
  });
};

export const verifyToken = (token: string) => {
  // Return null gracefully if JWT_SECRET is not configured (e.g. during next build).
  // All protected routes treat null as unauthenticated, so this is safe.
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    return jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
};
