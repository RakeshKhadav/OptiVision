import jwt, { SignOptions } from "jsonwebtoken";

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const generateToken = (user: UserPayload): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): UserPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as UserPayload;
    // Optionally, add a runtime check:
    if (!decoded || !decoded.id || !decoded.email || !decoded.role) {
      throw new Error("Invalid token payload");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
