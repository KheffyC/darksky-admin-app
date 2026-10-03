import { isServablePath } from '@/lib/files';

export type ReimbursementInput = {
  paidBy: string;
  amount: string;
  description: string;
  purchasedOn: string;
  receiptPath: string | null;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseReimbursementInput(body: unknown): ReimbursementInput | { error: string } {
  const input = (body ?? {}) as Record<string, unknown>;
  const paidBy = typeof input.paidBy === 'string' ? input.paidBy : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const purchasedOn = typeof input.purchasedOn === 'string' ? input.purchasedOn : '';
  const amount = Number(String(input.amount ?? '').replace(/[$,\s]/g, ''));
  const receiptPath = typeof input.receiptPath === 'string' && input.receiptPath ? input.receiptPath : null;

  if (!paidBy || !description || !purchasedOn) {
    return { error: 'Amount, description, date, and who paid are required' };
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount >= 100_000_000) {
    return { error: 'Enter an amount greater than $0' };
  }
  if (!DATE_PATTERN.test(purchasedOn)) {
    return { error: 'Date must be YYYY-MM-DD' };
  }
  if (receiptPath && !(receiptPath.startsWith('receipts/') && isServablePath(receiptPath))) {
    return { error: 'Invalid receipt' };
  }

  return { paidBy, amount: amount.toFixed(2), description, purchasedOn, receiptPath };
}

export function isDate(value: unknown): value is string {
  return typeof value === 'string' && DATE_PATTERN.test(value);
}
