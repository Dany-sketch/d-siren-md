import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || password.length < 8) {
      return res.status(400).json({
        error: "Enter a valid email and password of at least 8 characters"
      });
    }

    const { data, error } = await authClient.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    res.json({
      success: true,
      message: "Registration submitted. Check your email if confirmation is required.",
      user: data.user,
      session: data.session
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const { data, error } =
      await authClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    res.json({
      success: true,
      user: data.user,
      session: data.session
    });
  } catch {
    res.status(401).json({
      error: "Login failed. Check your credentials."
    });
  }
});

export default router;
