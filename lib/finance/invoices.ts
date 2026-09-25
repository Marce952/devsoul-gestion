import { Currency, Prisma } from "@prisma/client";
import { toArs } from "./rates";

type InvoiceAmount = {
  amount: Prisma.Decimal | number;
  currency: Currency;
  rateToArs?: Prisma.Decimal | null;
};

export function invoiceAmountArs(invoice: InvoiceAmount, usdRate: number | null) {
  if (invoice.currency === Currency.ARS) return Number(invoice.amount);
  const rate = invoice.rateToArs ? Number(invoice.rateToArs) : usdRate;
  return rate === null ? 0 : toArs(invoice.amount, rate);
}
