import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  assignInterestProfileToParty,
  createCostCategory,
  createCostCenter,
  createInterestProfile,
  deleteCostCategory,
  deleteCostCenter,
  deleteInterestProfile,
  getCostCategoryTree,
  listCostCenters,
  listInterestProfiles,
  listPartyInterestSettings,
  removeInterestSettingForParty,
  updateCostCategory,
  updateCostCenter,
  updateInterestProfile,
} from "../services/costManagement";

const router = Router();

router.use(authenticateToken);

// Cost Categories
router.get("/categories", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const categories = await getCostCategoryTree(startupId);
    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error("List cost categories error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch cost categories",
    });
  }
});

router.post("/categories", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const category = await createCostCategory(startupId, req.body);
    return res.status(201).json({
      success: true,
      data: category,
      message: "Cost category created successfully",
    });
  } catch (error) {
    console.error("Create cost category error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create cost category",
    });
  }
});

router.put(
  "/categories/:categoryId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      const category = await updateCostCategory(
        startupId,
        req.params.categoryId,
        req.body
      );
      return res.json({
        success: true,
        data: category,
        message: "Cost category updated successfully",
      });
    } catch (error) {
      console.error("Update cost category error:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update cost category",
      });
    }
  }
);

router.delete(
  "/categories/:categoryId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      await deleteCostCategory(startupId, req.params.categoryId);
      return res.json({
        success: true,
        message: "Cost category deleted successfully",
      });
    } catch (error) {
      console.error("Delete cost category error:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete cost category",
      });
    }
  }
);

// Cost Centers
router.get("/centers", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { categoryId, status } = req.query;
    const centers = await listCostCenters(startupId, {
      categoryId: categoryId as string | undefined,
      status: status as string | undefined,
    });

    return res.json({ success: true, data: centers });
  } catch (error) {
    console.error("List cost centers error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch cost centers",
    });
  }
});

router.post("/centers", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const center = await createCostCenter(startupId, req.body);
    return res.status(201).json({
      success: true,
      data: center,
      message: "Cost center created successfully",
    });
  } catch (error) {
    console.error("Create cost center error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create cost center",
    });
  }
});

router.put("/centers/:centerId", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const center = await updateCostCenter(
      startupId,
      req.params.centerId,
      req.body
    );
    return res.json({
      success: true,
      data: center,
      message: "Cost center updated successfully",
    });
  } catch (error) {
    console.error("Update cost center error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update cost center",
    });
  }
});

router.delete("/centers/:centerId", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    await deleteCostCenter(startupId, req.params.centerId);
    return res.json({
      success: true,
      message: "Cost center deleted successfully",
    });
  } catch (error) {
    console.error("Delete cost center error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete cost center",
    });
  }
});

// Interest Profiles
router.get("/interest-profiles", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const profiles = await listInterestProfiles(startupId);
    return res.json({ success: true, data: profiles });
  } catch (error) {
    console.error("List interest profiles error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch interest profiles",
    });
  }
});

router.post("/interest-profiles", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const profile = await createInterestProfile(startupId, req.body);
    return res.status(201).json({
      success: true,
      data: profile,
      message: "Interest profile created successfully",
    });
  } catch (error) {
    console.error("Create interest profile error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create interest profile",
    });
  }
});

router.put(
  "/interest-profiles/:profileId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      const profile = await updateInterestProfile(
        startupId,
        req.params.profileId,
        req.body
      );
      return res.json({
        success: true,
        data: profile,
        message: "Interest profile updated successfully",
      });
    } catch (error) {
      console.error("Update interest profile error:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update interest profile",
      });
    }
  }
);

router.delete(
  "/interest-profiles/:profileId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      await deleteInterestProfile(startupId, req.params.profileId);
      return res.json({
        success: true,
        message: "Interest profile deleted successfully",
      });
    } catch (error) {
      console.error("Delete interest profile error:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete interest profile",
      });
    }
  }
);

// Party Interest Settings
router.get("/interest-settings", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const settings = await listPartyInterestSettings(startupId);
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("List party interest settings error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch party interest settings",
    });
  }
});

router.post("/interest-settings", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const setting = await assignInterestProfileToParty(startupId, req.body);
    return res.status(201).json({
      success: true,
      data: setting,
      message: "Interest setting applied to party",
    });
  } catch (error) {
    console.error("Assign interest setting error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to assign interest setting",
    });
  }
});

router.delete(
  "/interest-settings/:partyId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      await removeInterestSettingForParty(startupId, req.params.partyId);
      return res.json({
        success: true,
        message: "Interest setting removed for party",
      });
    } catch (error) {
      console.error("Remove interest setting error:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove interest setting",
      });
    }
  }
);

export default router;
