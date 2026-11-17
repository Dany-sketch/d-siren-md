import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";
import { requestPairingCode } from "../bot/sessionManager.js";
import { supabase } from "../database/supabase.js";

const router = Router();

const pairingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

// Check the authenticated user's connection status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("whatsapp_sessions")
      .select("status, updated_at")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      status: data?.status || "disconnected",
      updatedAt: data?.updated_at || null
    });
  } catch {
    res.status(500).json({
      error: "Could not retrieve connection status"
    });
  }
});

// Request a WhatsApp pairing code
router.post(
  "/pair",
  pairingLimiter,
  requireAuth,
  async (req, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          error: "Phone number is required"
        });
      }

      const pairingCode = await requestPairingCode(
        req.user.id,
        phoneNumber
      );

      res.json({
        success: true,
        pairingCode
      });
    } catch {
      res.status(400).json({
        error: "Pairing request failed"
      });
    }
  }
);

export default router;
