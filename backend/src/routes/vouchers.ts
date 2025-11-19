import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  listVoucherTypes,
  createVoucherType,
  updateVoucherType,
  createVoucherNumberingSeries,
  getNextVoucherNumber,
} from '../services/voucherTypes';
import { createVoucher, listVouchers, createReversingJournal } from '../services/vouchers';
import { VoucherCategory, VoucherEntryType, VoucherNumberingBehavior, VoucherNumberingMethod, VoucherBillReferenceType } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/types', async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: 'Startup context is required' });
    }

    const voucherTypes = await listVoucherTypes(startupId);
    return res.json({ success: true, data: voucherTypes });
  } catch (error) {
    console.error('List voucher types error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch voucher types',
    });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: 'Startup context is required' });
    }

    const vouchers = await listVouchers(startupId, {
      voucherTypeId: req.query.voucherTypeId as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });

    return res.json({ success: true, data: vouchers });
  } catch (error) {
    console.error('List vouchers error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch vouchers',
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: 'Startup context is required' });
    }

    const { voucherTypeId, numberingSeriesId, date, reference, narration, entries, createdById } = req.body;

    if (!voucherTypeId) {
      return res.status(400).json({ success: false, message: 'Voucher type is required' });
    }

    if (!Array.isArray(entries) || entries.length < 2) {
      return res.status(400).json({ success: false, message: 'Voucher entries are required' });
    }

    const normalizedEntries = entries.map((entry: any) => ({
      ledgerName: entry.ledgerName,
      ledgerCode: entry.ledgerCode,
      entryType: entry.entryType as VoucherEntryType,
      amount: Number(entry.amount),
      narration: entry.narration,
      costCenterName: entry.costCenterName,
      costCategory: entry.costCategory,
      billReferences: Array.isArray(entry.billReferences)
        ? entry.billReferences.map((bill: any) => ({
            reference: bill.reference,
            amount: Number(bill.amount),
            referenceType: bill.referenceType as VoucherBillReferenceType | undefined,
            dueDate: bill.dueDate,
            remarks: bill.remarks,
          }))
        : undefined,
    }));

    const voucher = await createVoucher(startupId, {
      voucherTypeId,
      numberingSeriesId,
      date,
      reference,
      narration,
      entries: normalizedEntries,
      createdById: createdById ?? req.user?.userId,
    });

    return res.status(201).json({
      success: true,
      data: voucher,
      message: 'Voucher created successfully',
    });
  } catch (error) {
    console.error('Create voucher error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create voucher',
    });
  }
});

router.post('/types', async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: 'Startup context is required' });
    }

    const { name, abbreviation, category, numberingMethod, numberingBehavior, prefix, suffix, allowManualOverride, allowDuplicateNumbers } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    if (!(category in VoucherCategory)) {
      return res.status(400).json({ success: false, message: 'Invalid voucher category' });
    }

    const voucherType = await createVoucherType(startupId, {
      name,
      abbreviation,
      category,
      numberingMethod,
      numberingBehavior,
      prefix,
      suffix,
      allowManualOverride,
      allowDuplicateNumbers,
    });

    return res.status(201).json({ success: true, data: voucherType, message: 'Voucher type created' });
  } catch (error) {
    console.error('Create voucher type error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create voucher type',
    });
  }
});

router.put('/types/:voucherTypeId', async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: 'Startup context is required' });
    }

    const { voucherTypeId } = req.params;
    const payload = req.body as {
      abbreviation?: string | null;
      numberingMethod?: VoucherNumberingMethod;
      numberingBehavior?: VoucherNumberingBehavior;
      prefix?: string | null;
      suffix?: string | null;
      allowManualOverride?: boolean;
      allowDuplicateNumbers?: boolean;
      nextNumber?: number;
    };

    const voucherType = await updateVoucherType(startupId, voucherTypeId, payload);
    return res.json({ success: true, data: voucherType, message: 'Voucher type updated' });
  } catch (error) {
    console.error('Update voucher type error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update voucher type',
    });
  }
});

router.post('/types/:voucherTypeId/series', async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: 'Startup context is required' });
    }

    const { voucherTypeId } = req.params;
    const series = await createVoucherNumberingSeries(startupId, voucherTypeId, req.body);
    return res.status(201).json({ success: true, data: series, message: 'Numbering series created' });
  } catch (error) {
    console.error('Create numbering series error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create numbering series',
    });
  }
});

router.post('/types/:voucherTypeId/next-number', async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: 'Startup context is required' });
    }

    const { voucherTypeId } = req.params;
    const { numberingSeriesId } = req.body as { numberingSeriesId?: string };

    const voucherNumber = await getNextVoucherNumber(startupId, voucherTypeId, numberingSeriesId);
    return res.json({ success: true, data: { voucherNumber } });
  } catch (error) {
    console.error('Generate next voucher number error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate voucher number',
    });
  }
});

// Create reversing journal
router.post('/:voucherId/reverse', async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res.status(400).json({ success: false, message: 'Startup context is required' });
    }

    const { voucherId } = req.params;
    const { reversalDate, narration } = req.body;

    const result = await createReversingJournal(
      startupId,
      voucherId,
      reversalDate,
      narration
    );

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Reversing journal created successfully',
    });
  } catch (error) {
    console.error('Create reversing journal error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create reversing journal',
    });
  }
});

export default router;
