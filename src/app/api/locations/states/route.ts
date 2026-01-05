import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const GEONAMES_USERNAME = process.env.GEONAMES_USERNAME || "demo";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("countryCode");

    if (!countryCode) {
      return NextResponse.json(
        { error: "Country code is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedStates = await prisma.state.findMany({
      where: { countryCode },
      orderBy: { stateName: "asc" },
      select: {
        id: true,
        stateCode: true,
        stateName: true,
        geonameId: true,
      },
    });

    if (cachedStates.length > 0) {
      return NextResponse.json({ states: cachedStates });
    }

    // Get country from database
    const country = await prisma.country.findUnique({
      where: { countryCode },
    });

    if (!country) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    // Fetch states from Geonames (admin divisions level 1)
    const response = await fetch(
      `http://api.geonames.org/childrenJSON?geonameId=${country.geonameId}&username=${GEONAMES_USERNAME}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch states from Geonames" },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.status?.message) {
      return NextResponse.json(
        { error: data.status.message, needsApiKey: true },
        { status: 400 }
      );
    }

    // Filter and cache administrative divisions (states/provinces)
    const states = await Promise.all(
      data.geonames
        .filter((item: any) => item.fcode.startsWith("ADM1"))
        .map(async (state: any) => {
          // Extract state code (usually last 2 characters after dot)
          const stateCode = state.adminCode1 || state.fcode;

          return prisma.state.upsert({
            where: { geonameId: state.geonameId },
            update: {
              stateCode,
              stateName: state.name,
              countryCode,
            },
            create: {
              geonameId: state.geonameId,
              stateCode,
              stateName: state.name,
              countryCode,
              countryId: country.id,
            },
          });
        })
    );

    return NextResponse.json({
      states: states.map((s) => ({
        id: s.id,
        stateCode: s.stateCode,
        stateName: s.stateName,
        geonameId: s.geonameId,
      })),
    });
  } catch (error) {
    console.error("Error fetching states:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
