import { Router, Response } from "express";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { createParty, listParties } from "../services/parties";

const router = Router();

router.use(authenticateToken);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const parties = await listParties(startupId);
    return res.json({ success: true, data: parties });
  } catch (error) {
    console.error("List parties error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch parties",
    });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const party = await createParty(startupId, req.body);
    return res
      .status(201)
      .json({ success: true, data: party, message: "Party created successfully" });
  } catch (error) {
    console.error("Create party error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create party",
    });
  }
});

export default router;

