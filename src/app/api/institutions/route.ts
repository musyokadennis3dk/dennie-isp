import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { institutions, payments } from "@/db/schema";
import { REGISTRATION_FEE } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allInstitutions = await db.select().from(institutions).orderBy(institutions.name);
    return NextResponse.json(allInstitutions);
  } catch (error) {
    console.error("Error fetching institutions:", error);
    return NextResponse.json({ error: "Failed to fetch institutions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      address,
      county,
      email,
      phone,
      contactName,
      contactRole,
      contactPhone,
      contactEmail,
      numberOfUsers,
      hasComputers,
      hasLan,
    } = body;

    // Validate required fields
    if (!name || !type || !address || !county || !email || !phone || !contactName || !contactRole || !contactPhone || !contactEmail) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }

    // Check for duplicate email
    const existing = await db.select().from(institutions).where(eq(institutions.email, email));
    if (existing.length > 0) {
      return NextResponse.json({ error: "An institution with this email already exists" }, { status: 409 });
    }

    // Insert institution
    const [newInstitution] = await db
      .insert(institutions)
      .values({
        name,
        type,
        address,
        county,
        email,
        phone,
        contactName,
        contactRole,
        contactPhone,
        contactEmail,
        numberOfUsers: numberOfUsers ? parseInt(numberOfUsers) : null,
        hasComputers: hasComputers === true || hasComputers === "true",
        hasLan: hasLan === true || hasLan === "true",
        registrationStatus: "registered",
        registrationDate: new Date(),
      })
      .returning();

    // Record registration fee payment
    await db.insert(payments).values({
      institutionId: newInstitution.id,
      paymentType: "registration",
      amount: REGISTRATION_FEE,
      paymentDate: new Date(),
      notes: "Registration fee paid upon enrollment",
      status: "paid",
    });

    return NextResponse.json(newInstitution, { status: 201 });
  } catch (error) {
    console.error("Error creating institution:", error);
    return NextResponse.json({ error: "Failed to create institution" }, { status: 500 });
  }
}
