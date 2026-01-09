import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../services/customers";

const router = Router();

router.use(authenticateToken);

// List all customers
router.get("/", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const isActive =
      req.query.isActive === undefined
        ? undefined
        : req.query.isActive === "true";
    const searchTerm = req.query.searchTerm as string | undefined;

    const customers = await listCustomers(startupId, {
      isActive,
      searchTerm,
    });

    return res.json({ success: true, data: customers });
  } catch (error) {
    console.error("List customers error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch customers",
    });
  }
});

// Get a single customer
router.get("/:customerId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const customer = await getCustomer(startupId, req.params.customerId);

    return res.json({ success: true, data: customer });
  } catch (error) {
    console.error("Get customer error:", error);
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Customer not found",
    });
  }
});

// Create a new customer
router.post("/", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const customer = await createCustomer(
      startupId,
      req.body,
      req.user?.userId
    );

    return res.status(201).json({
      success: true,
      data: customer,
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("Create customer error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create customer",
    });
  }
});

// Update a customer
router.put("/:customerId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const customer = await updateCustomer(
      startupId,
      req.params.customerId,
      req.body,
      req.user?.userId
    );

    return res.json({
      success: true,
      data: customer,
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("Update customer error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update customer",
    });
  }
});

// Delete a customer (soft delete)
router.delete("/:customerId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    await deleteCustomer(startupId, req.params.customerId, req.user?.userId);

    return res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete customer",
    });
  }
});

export default router;
