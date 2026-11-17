import { supabase } from "../database/supabase.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Invalid or expired session"
      });
    }

    req.user = data.user;
    next();
  } catch {
    res.status(500).json({
      error: "Authentication failed"
    });
  }
}
