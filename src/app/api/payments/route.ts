import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { institutions, payments, monthlyBills } from "@/db/schema";
import {
  INSTALLATION_FEE,
  getBandwidthCost,
  calculateUpgradeCost,
  calculateOverdueFine,
  RECONNECTION_FEE,
} from "@/lib/utils";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const allPayments = await db.select().from(payments).orderBy(payments.paymentDate);
    return NextResponse.json(allPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { institutionId, paymentType, billingMonth, bandwidthMbps, isUpgrade, notes } = body;

    const [institution] = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, parseInt(institutionId)));

    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    let amount = 0;
    let discountAmount = 0;
    const results: Record<string, unknown>[] = [];

    if (paymentType === "installation") {
      // Check if already paid
      const existingInstallation = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.institutionId, parseInt(institutionId)),
            eq(payments.paymentType, "installation")
          )
        );

      if (existingInstallation.length > 0) {
        return NextResponse.json({ error: "Installation fee already paid" }, { status: 409 });
      }

      amount = INSTALLATION_FEE;

      const [payment] = await db
        .insert(payments)
        .values({
          institutionId: parseInt(institutionId),
          paymentType: "installation",
          amount,
          paymentDate: new Date(),
          notes: notes || "Installation fee",
          status: "paid",
        })
        .returning();

      // Update institution service status
      await db
        .update(institutions)
        .set({
          serviceStatus: "active",
          bandwidthMbps: bandwidthMbps ? parseInt(bandwidthMbps) : institution.bandwidthMbps,
          connectionDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(institutions.id, parseInt(institutionId)));

      results.push(payment);
    } else if (paymentType === "monthly") {
      if (!billingMonth || !bandwidthMbps) {
        return NextResponse.json(
          { error: "billingMonth and bandwidthMbps are required for monthly payments" },
          { status: 400 }
        );
      }

      // Check if bill already exists for this month
      const existingBill = await db
        .select()
        .from(monthlyBills)
        .where(
          and(
            eq(monthlyBills.institutionId, parseInt(institutionId)),
            eq(monthlyBills.billingMonth, billingMonth)
          )
        );

      const bwMbps = parseInt(bandwidthMbps);
      let baseAmount: number;
      let finalAmount: number;

      if (isUpgrade) {
        baseAmount = getBandwidthCost(bwMbps);
        discountAmount = baseAmount * 0.1;
        finalAmount = baseAmount - discountAmount;
      } else {
        baseAmount = getBandwidthCost(bwMbps);
        finalAmount = baseAmount;
      }

      // Calculate due date (end of billing month)
      const [year, month] = billingMonth.split("-").map(Number);
      const dueDate = new Date(year, month, 0); // last day of month

      let bill;
      if (existingBill.length > 0) {
        // Update existing bill to paid
        [bill] = await db
          .update(monthlyBills)
          .set({
            status: "paid",
            paidDate: new Date(),
            bandwidthMbps: bwMbps,
            baseAmount,
            isUpgrade: isUpgrade || false,
            discountAmount,
            totalAmount: finalAmount,
          })
          .where(eq(monthlyBills.id, existingBill[0].id))
          .returning();
      } else {
        [bill] = await db
          .insert(monthlyBills)
          .values({
            institutionId: parseInt(institutionId),
            billingMonth,
            bandwidthMbps: bwMbps,
            baseAmount,
            isUpgrade: isUpgrade || false,
            discountAmount,
            totalAmount: finalAmount,
            dueDate,
            paidDate: new Date(),
            status: "paid",
          })
          .returning();
      }

      // Record payment
      const [payment] = await db
        .insert(payments)
        .values({
          institutionId: parseInt(institutionId),
          paymentType: "monthly",
          amount: finalAmount,
          paymentDate: new Date(),
          billingMonth,
          bandwidthMbps: bwMbps,
          isUpgrade: isUpgrade || false,
          discountAmount,
          notes: notes || `Monthly payment for ${billingMonth}`,
          status: "paid",
        })
        .returning();

      // Update institution bandwidth if changed
      if (bwMbps !== institution.bandwidthMbps) {
        await db
          .update(institutions)
          .set({ bandwidthMbps: bwMbps, updatedAt: new Date() })
          .where(eq(institutions.id, parseInt(institutionId)));
      }

      // If institution was disconnected, add reconnection fee
      if (institution.serviceStatus === "disconnected") {
        const [reconnPayment] = await db
          .insert(payments)
          .values({
            institutionId: parseInt(institutionId),
            paymentType: "reconnection",
            amount: RECONNECTION_FEE,
            paymentDate: new Date(),
            billingMonth,
            notes: "Reconnection fee after disconnection",
            status: "paid",
          })
          .returning();

        await db
          .update(institutions)
          .set({ serviceStatus: "active", updatedAt: new Date() })
          .where(eq(institutions.id, parseInt(institutionId)));

        results.push(payment, reconnPayment);
      } else {
        results.push(payment);
      }

      results.push(bill);
    } else if (paymentType === "overdue_fine") {
      if (!billingMonth) {
        return NextResponse.json({ error: "billingMonth is required for overdue fine" }, { status: 400 });
      }

      // Find the bill
      const [bill] = await db
        .select()
        .from(monthlyBills)
        .where(
          and(
            eq(monthlyBills.institutionId, parseInt(institutionId)),
            eq(monthlyBills.billingMonth, billingMonth)
          )
        );

      if (!bill) {
        return NextResponse.json({ error: "Bill not found for this month" }, { status: 404 });
      }

      amount = calculateOverdueFine(bill.totalAmount);

      const [payment] = await db
        .insert(payments)
        .values({
          institutionId: parseInt(institutionId),
          paymentType: "overdue_fine",
          amount,
          paymentDate: new Date(),
          billingMonth,
          notes: notes || `Overdue fine for ${billingMonth}`,
          status: "paid",
        })
        .returning();

      // Update bill
      await db
        .update(monthlyBills)
        .set({ overdueFine: amount })
        .where(eq(monthlyBills.id, bill.id));

      results.push(payment);
    }

    return NextResponse.json({ success: true, results }, { status: 201 });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}
