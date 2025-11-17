import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  listLedgerGroups,
  createLedgerGroup,
  updateLedgerGroup,
  deleteLedgerGroup,
  listLedgers,
  createLedger,
  updateLedger,
  deleteLedger,
} from "../services/bookkeeping";

const router = Router();

router.use(authenticateToken);

router.get("/ledger-groups", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: "Startup context is required" });
    }

    const groups = await listLedgerGroups(startupId);

    return res.json({ success: true, data: groups });
  } catch (error) {
    console.error("List ledger groups error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch ledger groups",
    });
  }
});

router.post("/ledger-groups", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: "Startup context is required" });
    }

    const created = await createLedgerGroup(startupId, req.body);
    return res.status(201).json({
      success: true,
      data: created,
      message: "Ledger group created successfully",
    });
  } catch (error) {
    console.error("Create ledger group error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create ledger group",
    });
  }
});

router.put("/ledger-groups/:groupId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: "Startup context is required" });
    }

    const updated = await updateLedgerGroup(startupId, req.params.groupId, req.body);
    return res.json({
      success: true,
      data: updated,
      message: "Ledger group updated successfully",
    });
  } catch (error) {
    console.error("Update ledger group error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update ledger group",
    });
  }
});

router.delete("/ledger-groups/:groupId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: "Startup context is required" });
    }

    await deleteLedgerGroup(startupId, req.params.groupId);
    return res.json({
      success: true,
      message: "Ledger group deleted successfully",
    });
  } catch (error) {
    console.error("Delete ledger group error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete ledger group",
    });
  }
});

router.get("/ledgers", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: "Startup context is required" });
    }

    const ledgers = await listLedgers(startupId);
    return res.json({ success: true, data: ledgers });
  } catch (error) {
    console.error("List ledgers error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch ledgers",
    });
  }
});

router.post("/ledgers", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: "Startup context is required" });
    }

    const created = await createLedger(startupId, req.body);
    return res.status(201).json({
      success: true,
      data: created,
      message: "Ledger created successfully",
    });
  } catch (error) {
    console.error("Create ledger error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create ledger",
    });
  }
});

router.put("/ledgers/:ledgerId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: "Startup context is required" });
    }

    const updated = await updateLedger(startupId, req.params.ledgerId, req.body);
    return res.json({
      success: true,
      data: updated,
      message: "Ledger updated successfully",
    });
  } catch (error) {
    console.error("Update ledger error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update ledger",
    });
  }
});

router.delete("/ledgers/:ledgerId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: "Startup context is required" });
    }

    await deleteLedger(startupId, req.params.ledgerId);
    return res.json({
      success: true,
      message: "Ledger deleted successfully",
    });
  } catch (error) {
    console.error("Delete ledger error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete ledger",
    });
  }
});

export default router;

