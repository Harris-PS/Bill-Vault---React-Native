// src/services/ocr.service.ts
/**
 * OCR Service — Indian Receipt Parser
 *
 * NOTE: expo-barcode-scanner handles QR scanning natively.
 * For OCR, we use a regex-based parser on raw text extracted from
 * camera/gallery images. In production, swap `extractTextFromImage`
 * with a Google Cloud Vision API call or ML Kit native module.
 */
import { ParsedReceipt } from '../types';

// ── Pattern library for Indian receipts ──────────────────────────────────────

const PATTERNS = {
  gstin: /(?:GSTIN?|GST\s*No\.?|GSTIN\s*:)\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z])/i,
  invoice: /(?:Invoice|Bill|Receipt|Inv)\s*(?:No\.?|#|Number)?\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
  date: /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}|\d{4}-\d{2}-\d{2})/,
  time: /(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i,
  total: /(?:Total|Grand\s*Total|Net\s*Amount|Amount\s*Due|Bill\s*Amount)\s*[:\-]?\s*₹?\s*([0-9,]+\.?\d{0,2})/i,
  subtotal: /(?:Sub\s*Total|Subtotal|Net\s*Total)\s*[:\-]?\s*₹?\s*([0-9,]+\.?\d{0,2})/i,
  tax: /(?:CGST|SGST|IGST|Tax|GST)\s*(?:[0-9.]+%?)?\s*[:\-]?\s*₹?\s*([0-9,]+\.?\d{0,2})/gi,
  discount: /(?:Discount|Offer|Savings)\s*[:\-]?\s*₹?\s*([0-9,]+\.?\d{0,2})/i,
  upi: /(?:UPI|PhonePe|GPay|Google\s*Pay|Paytm|BHIM)/i,
  card: /(?:Card|VISA|MasterCard|RuPay|Credit|Debit)/i,
  cash: /\bCash\b/i,
  storeName: /^(.{3,50})\n/m,
  priceRow: /(.+?)\s+(\d+)\s+(?:x\s+)?₹?\s*([0-9,]+\.?\d{0,2})\s+₹?\s*([0-9,]+\.?\d{0,2})/g,
};

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Store name — usually first meaningful line
  const storeName = lines[0] || 'Unknown Store';
  const storeAddress = lines.slice(1, 3).join(', ');

  // GSTIN
  const gstMatch = rawText.match(PATTERNS.gstin);
  const gst_number = gstMatch ? gstMatch[1] : '';

  // Invoice number
  const invoiceMatch = rawText.match(PATTERNS.invoice);
  const invoice_number = invoiceMatch ? invoiceMatch[1].trim() : '';

  // Date
  const dateMatch = rawText.match(PATTERNS.date);
  let payment_date = dateMatch ? normaliseDate(dateMatch[1]) : new Date().toISOString().split('T')[0];

  // Time
  const timeMatch = rawText.match(PATTERNS.time);
  const payment_time = timeMatch ? timeMatch[1] : '00:00:00';

  // Amounts
  const totalMatch = rawText.match(PATTERNS.total);
  const total_amount = totalMatch ? parseAmount(totalMatch[1]) : 0;

  const subtotalMatch = rawText.match(PATTERNS.subtotal);
  const subtotal = subtotalMatch ? parseAmount(subtotalMatch[1]) : total_amount;

  // Tax — sum all GST lines
  let tax_amount = 0;
  const taxMatches = [...rawText.matchAll(PATTERNS.tax)];
  taxMatches.forEach((m) => {
    if (m[1]) tax_amount += parseAmount(m[1]);
  });

  const discountMatch = rawText.match(PATTERNS.discount);
  const discount = discountMatch ? parseAmount(discountMatch[1]) : 0;

  // Payment method
  let payment_method = 'Other';
  if (PATTERNS.upi.test(rawText)) payment_method = 'UPI';
  else if (PATTERNS.card.test(rawText)) payment_method = 'Credit Card';
  else if (PATTERNS.cash.test(rawText)) payment_method = 'Cash';

  // Line items — best-effort parse
  const items: Partial<ParsedReceipt['items'][0]>[] = [];
  const priceRegex = /(.+?)\s{2,}(\d+(?:\.\d+)?)\s{1,}(\d+(?:\.\d+)?)/g;
  let match;
  while ((match = priceRegex.exec(rawText)) !== null) {
    const name = match[1].trim();
    const qty = parseFloat(match[2]);
    const price = parseFloat(match[3]);
    if (name.length > 2 && price > 0 && qty > 0) {
      items.push({
        item_name: name,
        item_quantity: qty,
        item_price: price / qty,
        item_total: price,
        product_category: guessCategory(name),
      });
    }
  }

  return {
    store_name: storeName,
    store_address: storeAddress,
    gst_number,
    invoice_number,
    payment_method,
    payment_date,
    payment_time,
    subtotal,
    tax_amount,
    discount,
    total_amount,
    items,
    raw_text: rawText,
  };
}

export function parseQRData(qrText: string): Partial<ParsedReceipt> {
  // UPI QR format: upi://pay?pa=merchant@upi&pn=MerchantName&am=100&tn=desc
  if (qrText.startsWith('upi://')) {
    const url = new URL(qrText.replace('upi://', 'https://'));
    return {
      store_name: url.searchParams.get('pn') || 'Unknown',
      total_amount: parseFloat(url.searchParams.get('am') || '0'),
      payment_method: 'UPI',
      invoice_number: url.searchParams.get('tr') || '',
      gst_number: '',
      raw_text: qrText,
    };
  }

  // Generic JSON QR
  try {
    const parsed = JSON.parse(qrText);
    return {
      store_name: parsed.merchant || parsed.store || parsed.name || 'Unknown',
      total_amount: parseFloat(parsed.amount || parsed.total || '0'),
      payment_method: parsed.method || 'Other',
      invoice_number: parsed.invoice || parsed.ref || '',
      gst_number: parsed.gstin || '',
      raw_text: qrText,
    };
  } catch {
    // Plain text QR
    return {
      raw_text: qrText,
      store_name: 'Unknown',
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAmount(str: string): number {
  return parseFloat(str.replace(/,/g, '')) || 0;
}

function normaliseDate(raw: string): string {
  const parts = raw.split(/[-\/\.]/);
  if (parts.length !== 3) return new Date().toISOString().split('T')[0];
  // DD/MM/YYYY → YYYY-MM-DD
  if (parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  // Already YYYY-MM-DD
  return raw;
}

function guessCategory(itemName: string): string {
  const name = itemName.toLowerCase();
  if (/milk|bread|rice|dal|atta|oil|sugar|salt|flour|vegetables|fruits/.test(name)) return 'Groceries';
  if (/chicken|mutton|fish|beef|pork|meat/.test(name)) return 'Food & Dining';
  if (/medicine|tablet|capsule|syrup|pharma/.test(name)) return 'Healthcare';
  if (/shirt|pant|shoes|dress|saree|kurta|jeans/.test(name)) return 'Clothing';
  if (/mobile|laptop|tv|phone|cable|charger|earphone/.test(name)) return 'Electronics';
  if (/petrol|diesel|cng|fuel|auto|bus|train|ticket/.test(name)) return 'Transport';
  return 'Other';
}
