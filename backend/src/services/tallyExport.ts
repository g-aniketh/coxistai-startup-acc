import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import * as XLSX from 'xlsx';

/**
 * Export vouchers to Excel format
 */
export async function exportVouchersToExcel(
  startupId: string,
  filters?: {
    voucherTypeId?: string;
    fromDate?: string;
    toDate?: string;
    numberingSeriesId?: string;
  }
) {
  const where: any = {
    startupId,
  };

  if (filters?.voucherTypeId) {
    where.voucherTypeId = filters.voucherTypeId;
  }

  if (filters?.fromDate || filters?.toDate) {
    where.date = {};
    if (filters.fromDate) {
      where.date.gte = new Date(filters.fromDate);
    }
    if (filters.toDate) {
      where.date.lte = new Date(filters.toDate);
    }
  }

  if (filters?.numberingSeriesId) {
    where.numberingSeriesId = filters.numberingSeriesId;
  }

  const vouchers = await prisma.voucher.findMany({
    where,
    include: {
      voucherType: true,
      numberingSeries: true,
      entries: {
        include: {
          costCenter: true,
          costCategoryRef: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Vouchers sheet
  const vouchersData = vouchers.map((v: any) => ({
    'Voucher Number': v.voucherNumber,
    'Voucher Type': v.voucherType.name,
    'Numbering Series': v.numberingSeries?.name || '',
    Date: v.date.toISOString().split('T')[0],
    Reference: v.reference || '',
    Narration: v.narration || '',
    'Total Amount': v.totalAmount.toString(),
  }));

  const vouchersSheet = XLSX.utils.json_to_sheet(vouchersData);
  XLSX.utils.book_append_sheet(workbook, vouchersSheet, 'Vouchers');

  // Voucher Entries sheet
  const entriesData: any[] = [];
  for (const voucher of vouchers) {
    for (const entry of voucher.entries) {
      entriesData.push({
        'Voucher Number': voucher.voucherNumber,
        'Voucher Type': voucher.voucherType.name,
        'Ledger Name': entry.ledgerName,
        'Ledger Code': entry.ledgerCode || '',
        'Entry Type': entry.entryType,
        Amount: entry.amount.toString(),
        Narration: entry.narration || '',
        'Cost Center': entry.costCenter?.name || '',
        'Cost Category': entry.costCategoryRef?.name || '',
      });
    }
  }

  const entriesSheet = XLSX.utils.json_to_sheet(entriesData);
  XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Voucher Entries');

  return workbook;
}

/**
 * Export ledgers/parties to Excel format
 */
export async function exportLedgersToExcel(startupId: string) {
  const parties = await prisma.partyMaster.findMany({
    where: { startupId },
    orderBy: { name: 'asc' },
  });

  const workbook = XLSX.utils.book_new();

  const partiesData = parties.map((p: any) => ({
    Name: p.name,
    Type: p.type,
    Email: p.email || '',
    Phone: p.phone || '',
    'Opening Balance': p.openingBalance.toString(),
    'Balance Type': p.balanceType,
  }));

  const partiesSheet = XLSX.utils.json_to_sheet(partiesData);
  XLSX.utils.book_append_sheet(workbook, partiesSheet, 'Ledgers');

  return workbook;
}

/**
 * Export GST data to Excel format
 */
export async function exportGstDataToExcel(startupId: string) {
  const [registrations, taxRates, ledgerMappings] = await Promise.all([
    prisma.gstRegistration.findMany({
      where: { startupId },
      orderBy: { isDefault: 'desc' },
    }),
    prisma.gstTaxRate.findMany({
      where: { startupId },
      orderBy: { effectiveFrom: 'desc' },
    }),
    prisma.gstLedgerMapping.findMany({
      where: { startupId },
      include: {
        registration: true,
      },
    }),
  ]);

  const workbook = XLSX.utils.book_new();

  // GST Registrations sheet
  const registrationsData = registrations.map((r: any) => ({
    GSTIN: r.gstin,
    'Legal Name': r.legalName || '',
    'Trade Name': r.tradeName || '',
    'Registration Type': r.registrationType,
    'State Code': r.stateCode,
    'State Name': r.stateName || '',
    'Start Date': r.startDate.toISOString().split('T')[0],
    'End Date': r.endDate?.toISOString().split('T')[0] || '',
    'Is Default': r.isDefault ? 'Yes' : 'No',
    'Is Active': r.isActive ? 'Yes' : 'No',
  }));

  const registrationsSheet = XLSX.utils.json_to_sheet(registrationsData);
  XLSX.utils.book_append_sheet(workbook, registrationsSheet, 'GST Registrations');

  // Tax Rates sheet
  const taxRatesData = taxRates.map((tr: any) => ({
    'Supply Type': tr.supplyType,
    'HSN/SAC': tr.hsnOrSac || '',
    Description: tr.description || '',
    'CGST Rate': tr.cgstRate.toString(),
    'SGST Rate': tr.sgstRate.toString(),
    'IGST Rate': tr.igstRate.toString(),
    'CESS Rate': tr.cessRate.toString(),
    'Effective From': tr.effectiveFrom?.toISOString().split('T')[0] || '',
    'Effective To': tr.effectiveTo?.toISOString().split('T')[0] || '',
    'Is Active': tr.isActive ? 'Yes' : 'No',
  }));

  const taxRatesSheet = XLSX.utils.json_to_sheet(taxRatesData);
  XLSX.utils.book_append_sheet(workbook, taxRatesSheet, 'Tax Rates');

  // Ledger Mappings sheet
  const mappingsData = ledgerMappings.map((lm: any) => ({
    'Mapping Type': lm.mappingType,
    'Ledger Name': lm.ledgerName,
    'Ledger Code': lm.ledgerCode || '',
    Description: lm.description || '',
    GSTIN: lm.registration?.gstin || '',
  }));

  const mappingsSheet = XLSX.utils.json_to_sheet(mappingsData);
  XLSX.utils.book_append_sheet(workbook, mappingsSheet, 'Ledger Mappings');

  return workbook;
}

/**
 * Generate Excel template for Tally import
 */
export function generateTallyImportTemplate() {
  const workbook = XLSX.utils.book_new();

  // Vouchers template
  const vouchersTemplate = [
    {
      'Voucher Number': 'SALES-001',
      'Voucher Type': 'Sales',
      'Numbering Series': 'SALES',
      Date: '2024-01-01',
      Reference: 'REF-001',
      Narration: 'Sample sales voucher',
    },
  ];

  const vouchersSheet = XLSX.utils.json_to_sheet(vouchersTemplate);
  XLSX.utils.book_append_sheet(workbook, vouchersSheet, 'Vouchers');

  // Voucher Entries template
  const entriesTemplate = [
    {
      'Voucher Number': 'SALES-001',
      'Ledger Name': 'Sales Account',
      'Ledger Code': 'SLS001',
      'Entry Type': 'CREDIT',
      Amount: '10000.00',
      Narration: 'Sales entry',
      'Cost Center': '',
      'Cost Category': '',
      'CGST': '900.00',
      'SGST': '900.00',
      'IGST': '',
      'CESS': '',
      'HSN/SAC': '998314',
      'Taxable Amount': '10000.00',
    },
    {
      'Voucher Number': 'SALES-001',
      'Ledger Name': 'Bank Account',
      'Ledger Code': 'BNK001',
      'Entry Type': 'DEBIT',
      Amount: '11800.00',
      Narration: 'Bank entry',
      'Cost Center': '',
      'Cost Category': '',
      'CGST': '',
      'SGST': '',
      'IGST': '',
      'CESS': '',
      'HSN/SAC': '',
      'Taxable Amount': '',
    },
  ];

  const entriesSheet = XLSX.utils.json_to_sheet(entriesTemplate);
  XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Voucher Entries');

  // Ledgers template
  const ledgersTemplate = [
    {
      Name: 'Customer ABC',
      Type: 'Customer',
      Email: 'customer@example.com',
      Phone: '1234567890',
      'Opening Balance': '0.00',
      'Balance Type': 'Debit',
    },
  ];

  const ledgersSheet = XLSX.utils.json_to_sheet(ledgersTemplate);
  XLSX.utils.book_append_sheet(workbook, ledgersSheet, 'Ledgers');

  // GST Registrations template
  const gstTemplate = [
    {
      GSTIN: '29ABCDE1234F1Z5',
      'State Code': '29',
      'State Name': 'Karnataka',
      'Registration Type': 'REGULAR',
    },
  ];

  const gstSheet = XLSX.utils.json_to_sheet(gstTemplate);
  XLSX.utils.book_append_sheet(workbook, gstSheet, 'GST Registrations');

  return workbook;
}

