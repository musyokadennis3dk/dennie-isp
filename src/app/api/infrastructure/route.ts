import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { institutions, infrastructurePurchases } from "@/db/schema";
import { getPcCost, getLanNodeCost } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allPurchases = await db.select().from(infrastructurePurchases);
    return NextResponse.json(allPurchases);
  } catch (error) {
    console.error("Error fetching infrastructure purchases:", error);
    return NextResponse.json({ error: "Failed to fetch infrastructure purchases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { institutionId, numberOfPcs, numberOfLanNodes, notes } = body;

    const [institution] = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, parseInt(institutionId)));

    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    const pcs = parseInt(numberOfPcs) || 0;
    const lanNodes = parseInt(numberOfLanNodes) || 0;

    const pcCostTotal = getPcCost(pcs);
    const lanCostTotal = lanNodes > 0 ? getLanNodeCost(lanNodes) : 0;
    const totalCost = pcCostTotal + lanCostTotal;

    const [purchase] = await db
      .insert(infrastructurePurchases)
      .values({
        institutionId: parseInt(institutionId),
        numberOfPcs: pcs,
        pcCostTotal,
        numberOfLanNodes: lanNodes,
        lanCostTotal,
        totalCost,
        notes,
      })
      .returning();

    // Update institution infrastructure status
    const updateData: Partial<typeof institution> = { updatedAt: new Date() };
    if (pcs > 0) updateData.hasComputers = true;
    if (lanNodes > 0) updateData.hasLan = true;

    await db
      .update(institutions)
      .set(updateData)
      .where(eq(institutions.id, parseInt(institutionId)));

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("Error recording infrastructure purchase:", error);
    return NextResponse.json({ error: "Failed to record infrastructure purchase" }, { status: 500 });
  }
}
