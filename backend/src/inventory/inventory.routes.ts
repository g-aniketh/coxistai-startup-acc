import { Router } from 'express';
import { authenticateToken, checkPermission } from '../middleware/auth';
import { 
  createProductController,
  getProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  simulateSaleController,
  getSalesController
} from './inventory.controller';

const router = Router();

// Product routes
router.post(
  '/products',
  authenticateToken,
  checkPermission({ action: 'manage', subject: 'inventory' }),
  createProductController
);

router.get(
  '/products',
  authenticateToken,
  checkPermission({ action: 'read', subject: 'inventory_dashboard' }),
  getProductsController
);

router.get(
  '/products/:productId',
  authenticateToken,
  checkPermission({ action: 'read', subject: 'inventory' }),
  getProductByIdController
);

router.put(
  '/products/:productId',
  authenticateToken,
  checkPermission({ action: 'manage', subject: 'inventory' }),
  updateProductController
);

router.delete(
  '/products/:productId',
  authenticateToken,
  checkPermission({ action: 'manage', subject: 'inventory' }),
  deleteProductController
);

// Sales routes
router.post(
  '/sales',
  authenticateToken,
  checkPermission({ action: 'manage', subject: 'inventory' }),
  simulateSaleController
);

router.get(
  '/sales',
  authenticateToken,
  checkPermission({ action: 'read', subject: 'inventory_dashboard' }),
  getSalesController
);

export default router;

