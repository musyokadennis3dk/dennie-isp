import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { institutions, monthlyBills } from "@/db/schema";
import { getBandwidthCost } from "@/lib/utils";
import { eq } from "drizzle-orm";

// Generate monthly bills for all active institutions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billingMonth } = body;

    if (!billingMonth) {
      return NextResponse.json({ error: "billingMonth is required (YYYY-MM)" }, { status: 400 });
    }

    // Get all active institutions
    const activeInstitutions = await db
      .select()
      .from(institutions)
      .where(eq(institutions.serviceStatus, "active"));

    const [year, month] = billingMonth.split("-").map(Number);
    const dueDate = new Date(year, month, 0); // last day of month
    const disconnectionDate = new Date(year, month, 10); // 10th of next month

    const created = [];
    const skipped = [];

    for (const inst of activeInstitutions) {
      if (!inst.bandwidthMbps) continue;

      // Check if bill already exists
      const existing = await db
        .select()
        .from(monthlyBills)
        .where(
          eq(monthlyBills.institutionId, inst.id)
        );

      const existingForMonth = existing.find((b) => b.billingMonth === billingMonth);
      if (existingForMonth) {
        skipped.push(inst.id);
        continue;
      }

      const baseAmount = getBandwidthCost(inst.bandwidthMbps);

      const [bill] = await db
        .insert(monthlyBills)
        .values({
          institutionId: inst.id,
          billingMonth,
          bandwidthMbps: inst.bandwidthMbps,
          baseAmount,
          isUpgrade: false,
          discountAmount: 0,
          totalAmount: baseAmount,
          dueDate,
          status: "pending",
        })
        .returning();

      created.push(bill);
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      skipped: skipped.length,
      bills: created,
    });
  } catch (error) {
    console.error("Error generating bills:", error);
    return NextResponse.json({ error: "Failed to generate bills" }, { status: 500 });
  }
}

// Update overdue bills and disconnect institutions
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, billingMonth } = body;

    if (action === "mark_overdue") {
      // Mark unpaid bills as overdue if past due date
      const now = new Date();
      const pendingBills = await db
        .select()
        .from(monthlyBills)
        .where(eq(monthlyBills.status, "pending"));

      let markedOverdue = 0;
      for (const bill of pendingBills) {
        if (bill.dueDate && new Date(bill.dueDate) < now) {
          const overdueFine = bill.totalAmount * 0.15;
          await db
            .update(monthlyBills)
            .set({ status: "overdue", overdueFine })
            .where(eq(monthlyBills.id, bill.id));
          markedOverdue++;
        }
      }

      return NextResponse.json({ success: true, markedOverdue });
    }

    if (action === "disconnect") {
      // Disconnect institutions with overdue bills past 10th of next month
      const now = new Date();
      const overdueBills = await db
        .select()
        .from(monthlyBills)
        .where(eq(monthlyBills.status, "overdue"));

      let disconnected = 0;
      for (const bill of overdueBills) {
        const [year, month] = bill.billingMonth.split("-").map(Number);
        const disconnectionDate = new Date(year, month, 10);

        if (now > disconnectionDate) {
          await db
            .update(monthlyBills)
            .set({ status: "disconnected" })
            .where(eq(monthlyBills.id, bill.id));

          await db
            .update(institutions)
            .set({ serviceStatus: "disconnected", updatedAt: new Date() })
            .where(eq(institutions.id, bill.institutionId));

          disconnected++;
        }
      }

      return NextResponse.json({ success: true, disconnected });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating billing:", error);
    return NextResponse.json({ error: "Failed to update billing" }, { status: 500 });
  }
}
