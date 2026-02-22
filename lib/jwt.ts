import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");

export const signToken = (payload: object, expiresIn: string | number) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: expiresIn as any,
    algorithm: "HS256",
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET!, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
};
