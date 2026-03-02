import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { institutions, payments, monthlyBills, infrastructurePurchases } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");

    if (reportType === "registered") {
      // All registered institutions
      const data = await db
        .select()
        .from(institutions)
        .where(eq(institutions.registrationStatus, "registered"))
        .orderBy(institutions.name);
      return NextResponse.json(data);
    }

    if (reportType === "defaulters") {
      // Institutions with overdue bills (pending bills past due date)
      const overdueBills = await db
        .select({
          institution: institutions,
          bill: monthlyBills,
        })
        .from(monthlyBills)
        .innerJoin(institutions, eq(monthlyBills.institutionId, institutions.id))
        .where(eq(monthlyBills.status, "overdue"));

      return NextResponse.json(overdueBills);
    }

    if (reportType === "disconnected") {
      // Institutions with disconnected service
      const disconnected = await db
        .select()
        .from(institutions)
        .where(eq(institutions.serviceStatus, "disconnected"));
      return NextResponse.json(disconnected);
    }

    if (reportType === "infrastructure") {
      // Infrastructure details for each institution
      const data = await db
        .select({
          institution: institutions,
          purchase: infrastructurePurchases,
        })
        .from(institutions)
        .leftJoin(
          infrastructurePurchases,
          eq(institutions.id, infrastructurePurchases.institutionId)
        )
        .orderBy(institutions.name);
      return NextResponse.json(data);
    }

    if (reportType === "computations") {
      // Aggregate computations
      const allInstitutions = await db.select().from(institutions);
      const allPayments = await db.select().from(payments);
      const allBills = await db.select().from(monthlyBills);
      const allInfra = await db.select().from(infrastructurePurchases);

      // Total installation cost per institution
      const installationByInstitution = allPayments
        .filter((p) => p.paymentType === "installation")
        .reduce(
          (acc, p) => {
            acc[p.institutionId] = (acc[p.institutionId] || 0) + p.amount;
            return acc;
          },
          {} as Record<number, number>
        );

      // PC and LAN costs per institution
      const infraByInstitution = allInfra.reduce(
        (acc, i) => {
          if (!acc[i.institutionId]) {
            acc[i.institutionId] = { pcCost: 0, lanCost: 0, total: 0 };
          }
          acc[i.institutionId].pcCost += i.pcCostTotal;
          acc[i.institutionId].lanCost += i.lanCostTotal;
          acc[i.institutionId].total += i.totalCost;
          return acc;
        },
        {} as Record<number, { pcCost: number; lanCost: number; total: number }>
      );

      // Monthly charges by institution type
      const monthlyByType = allInstitutions.reduce(
        (acc, inst) => {
          const instPayments = allPayments.filter(
            (p) => p.institutionId === inst.id && p.paymentType === "monthly"
          );
          const total = instPayments.reduce((sum, p) => sum + p.amount, 0);
          if (!acc[inst.type]) acc[inst.type] = 0;
          acc[inst.type] += total;
          return acc;
        },
        {} as Record<string, number>
      );

      // Overdue fines and reconnection fees by institution type
      const finesByType = allInstitutions.reduce(
        (acc, inst) => {
          const fines = allPayments.filter(
            (p) =>
              p.institutionId === inst.id &&
              (p.paymentType === "overdue_fine" || p.paymentType === "reconnection")
          );
          const total = fines.reduce((sum, p) => sum + p.amount, 0);
          if (!acc[inst.type]) acc[inst.type] = { overdue: 0, reconnection: 0 };
          fines.forEach((p) => {
            if (p.paymentType === "overdue_fine") acc[inst.type].overdue += p.amount;
            if (p.paymentType === "reconnection") acc[inst.type].reconnection += p.amount;
          });
          return acc;
        },
        {} as Record<string, { overdue: number; reconnection: number }>
      );

      // Aggregate per institution
      const aggregateByInstitution = allInstitutions.map((inst) => {
        const instPayments = allPayments.filter((p) => p.institutionId === inst.id);
        const registration = instPayments
          .filter((p) => p.paymentType === "registration")
          .reduce((sum, p) => sum + p.amount, 0);
        const installation = instPayments
          .filter((p) => p.paymentType === "installation")
          .reduce((sum, p) => sum + p.amount, 0);
        const monthly = instPayments
          .filter((p) => p.paymentType === "monthly")
          .reduce((sum, p) => sum + p.amount, 0);
        const overdueFines = instPayments
          .filter((p) => p.paymentType === "overdue_fine")
          .reduce((sum, p) => sum + p.amount, 0);
        const reconnection = instPayments
          .filter((p) => p.paymentType === "reconnection")
          .reduce((sum, p) => sum + p.amount, 0);
        const infraCost = infraByInstitution[inst.id]?.total || 0;
        const total = registration + installation + monthly + overdueFines + reconnection + infraCost;

        return {
          institution: inst,
          registration,
          installation,
          monthly,
          overdueFines,
          reconnection,
          infraCost,
          total,
        };
      });

      return NextResponse.json({
        installationByInstitution,
        infraByInstitution,
        monthlyByType,
        finesByType,
        aggregateByInstitution,
      });
    }

    // Default: return all institutions with summary
    const allInstitutions = await db.select().from(institutions).orderBy(institutions.name);
    return NextResponse.json(allInstitutions);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
