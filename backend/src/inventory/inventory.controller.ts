import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as inventoryService from './inventory.service';

export const createProductController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { name, quantity, price } = req.body;

    // Validation
    if (!name || quantity === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, quantity, and price are required'
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number'
      });
    }

    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    const product = await inventoryService.createProduct(startupId, {
      name,
      quantity,
      price
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Create product error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

export const getProductsController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;

    const products = await inventoryService.getProducts(startupId);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export const getProductByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { productId } = req.params;

    const product = await inventoryService.getProductById(startupId, productId);

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(404).json({
      success: false,
      message: errorMessage
    });
  }
};

export const updateProductController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { productId } = req.params;
    const { name, quantity, price } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (quantity !== undefined) {
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a non-negative number'
        });
      }
      updateData.quantity = quantity;
    }
    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a positive number'
        });
      }
      updateData.price = price;
    }

    const product = await inventoryService.updateProduct(startupId, productId, updateData);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

export const deleteProductController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { productId } = req.params;

    await inventoryService.deleteProduct(startupId, productId);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

export const simulateSaleController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { productId, quantitySold, accountId } = req.body;

    // Validation
    if (!productId || !quantitySold || !accountId) {
      return res.status(400).json({
        success: false,
        message: 'ProductId, quantitySold, and accountId are required'
      });
    }

    if (typeof quantitySold !== 'number' || quantitySold <= 0) {
      return res.status(400).json({
        success: false,
        message: 'QuantitySold must be a positive number'
      });
    }

    const result = await inventoryService.simulateSale(startupId, {
      productId,
      quantitySold,
      accountId
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Sale simulated successfully'
    });
  } catch (error) {
    console.error('Simulate sale error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

export const getSalesController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { limit } = req.query;

    const limitParam = limit ? parseInt(limit as string, 10) : undefined;

    const sales = await inventoryService.getSales(startupId, limitParam);

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Get sales error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

