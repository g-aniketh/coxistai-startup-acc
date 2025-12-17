import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  createGstLedgerMapping,
  createGstRegistration,
  createGstTaxRate,
  deleteGstLedgerMapping,
  deleteGstRegistration,
  deleteGstTaxRate,
  listGstLedgerMappings,
  listGstRegistrations,
  listGstTaxRates,
  updateGstLedgerMapping,
  updateGstRegistration,
  updateGstTaxRate,
} from "../services/gst";
import { GstLedgerMappingType, GstTaxSupplyType } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

// ---------------------------------------------------------------------------
// GST Registrations
// ---------------------------------------------------------------------------

router.get("/registrations", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const registrations = await listGstRegistrations(startupId);
    return res.json({ success: true, data: registrations });
  } catch (error) {
    console.error("List GST registrations error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch GST registrations",
    });
  }
});

router.post("/registrations", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const registration = await createGstRegistration(startupId, req.body);
    return res.status(201).json({
      success: true,
      data: registration,
      message: "GST registration created successfully",
    });
  } catch (error) {
    console.error("Create GST registration error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create GST registration",
    });
  }
});

router.put(
  "/registrations/:registrationId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      const registration = await updateGstRegistration(
        startupId,
        req.params.registrationId,
        req.body
      );
      return res.json({
        success: true,
        data: registration,
        message: "GST registration updated successfully",
      });
    } catch (error) {
      console.error("Update GST registration error:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update GST registration",
      });
    }
  }
);

router.delete(
  "/registrations/:registrationId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      await deleteGstRegistration(startupId, req.params.registrationId);
      return res.json({
        success: true,
        message: "GST registration deleted successfully",
      });
    } catch (error) {
      console.error("Delete GST registration error:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete GST registration",
      });
    }
  }
);

// ---------------------------------------------------------------------------
// GST Tax Rates
// ---------------------------------------------------------------------------

router.get("/tax-rates", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { registrationId, supplyType, hsnOrSac } = req.query;
    const rates = await listGstTaxRates(startupId, {
      registrationId: registrationId as string | undefined,
      supplyType: supplyType as GstTaxSupplyType | undefined,
      hsnOrSac: hsnOrSac as string | undefined,
    });
    return res.json({ success: true, data: rates });
  } catch (error) {
    console.error("List GST tax rates error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch GST tax rates",
    });
  }
});

router.post("/tax-rates", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const rate = await createGstTaxRate(startupId, req.body);
    return res.status(201).json({
      success: true,
      data: rate,
      message: "GST tax rate created successfully",
    });
  } catch (error) {
    console.error("Create GST tax rate error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create GST tax rate",
    });
  }
});

router.put("/tax-rates/:taxRateId", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const rate = await updateGstTaxRate(
      startupId,
      req.params.taxRateId,
      req.body
    );
    return res.json({
      success: true,
      data: rate,
      message: "GST tax rate updated successfully",
    });
  } catch (error) {
    console.error("Update GST tax rate error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update GST tax rate",
    });
  }
});

router.delete(
  "/tax-rates/:taxRateId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      await deleteGstTaxRate(startupId, req.params.taxRateId);
      return res.json({
        success: true,
        message: "GST tax rate deleted successfully",
      });
    } catch (error) {
      console.error("Delete GST tax rate error:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete GST tax rate",
      });
    }
  }
);

// ---------------------------------------------------------------------------
// GST Ledger Mappings
// ---------------------------------------------------------------------------

router.get("/ledger-mappings", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { registrationId, mappingType } = req.query;
    const mappings = await listGstLedgerMappings(startupId, {
      registrationId: registrationId as string | undefined,
      mappingType: mappingType as GstLedgerMappingType | undefined,
    });
    return res.json({ success: true, data: mappings });
  } catch (error) {
    console.error("List GST ledger mappings error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch GST ledger mappings",
    });
  }
});

router.post("/ledger-mappings", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const mapping = await createGstLedgerMapping(startupId, req.body);
    return res.status(201).json({
      success: true,
      data: mapping,
      message: "GST ledger mapping created successfully",
    });
  } catch (error) {
    console.error("Create GST ledger mapping error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create GST ledger mapping",
    });
  }
});

router.put(
  "/ledger-mappings/:mappingId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      const mapping = await updateGstLedgerMapping(
        startupId,
        req.params.mappingId,
        req.body
      );
      return res.json({
        success: true,
        data: mapping,
        message: "GST ledger mapping updated successfully",
      });
    } catch (error) {
      console.error("Update GST ledger mapping error:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update GST ledger mapping",
      });
    }
  }
);

router.delete(
  "/ledger-mappings/:mappingId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      await deleteGstLedgerMapping(startupId, req.params.mappingId);
      return res.json({
        success: true,
        message: "GST ledger mapping deleted successfully",
      });
    } catch (error) {
      console.error("Delete GST ledger mapping error:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete GST ledger mapping",
      });
    }
  }
);

export default router;
