import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";
import {
  requestPairingCode
} from "../bot/sessionManager.js";

const router = Router();

const pairingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

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

      return res.json({
        success: true,
        pairingCode
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message || "Pairing request failed"
      });
    }
  }
);

export default router;
