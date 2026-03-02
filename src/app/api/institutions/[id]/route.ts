import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { institutions, payments, infrastructurePurchases, monthlyBills } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const institutionId = parseInt(id);

    const [institution] = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, institutionId));

    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    const institutionPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.institutionId, institutionId))
      .orderBy(payments.paymentDate);

    const infraPurchases = await db
      .select()
      .from(infrastructurePurchases)
      .where(eq(infrastructurePurchases.institutionId, institutionId));

    const bills = await db
      .select()
      .from(monthlyBills)
      .where(eq(monthlyBills.institutionId, institutionId))
      .orderBy(monthlyBills.billingMonth);

    return NextResponse.json({ institution, payments: institutionPayments, infraPurchases, bills });
  } catch (error) {
    console.error("Error fetching institution:", error);
    return NextResponse.json({ error: "Failed to fetch institution" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const institutionId = parseInt(id);
    const body = await request.json();

    const [updated] = await db
      .update(institutions)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(institutions.id, institutionId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating institution:", error);
    return NextResponse.json({ error: "Failed to update institution" }, { status: 500 });
  }
}
