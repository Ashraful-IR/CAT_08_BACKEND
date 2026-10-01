import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

// Resolves the Better Auth session from the request cookies and exposes a
// normalized req.user. `photoURL` is kept as an alias of Better Auth's `image`
// so the existing appointment/review/user code continues to work unchanged.
const authMiddleware = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      photoURL: session.user.image,
      image: session.user.image,
    };

    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid or expired session", error: error.message });
  }
};

export { authMiddleware };
