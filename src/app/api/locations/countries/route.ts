import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const GEONAMES_USERNAME = process.env.GEONAMES_USERNAME || "demo"; // User needs to register at geonames.org

export async function GET() {
  try {
    // Check if we have cached countries
    const cachedCountries = await prisma.country.findMany({
      orderBy: { countryName: "asc" },
      select: {
        id: true,
        countryCode: true,
        countryName: true,
        geonameId: true,
      },
    });

    if (cachedCountries.length > 0) {
      return NextResponse.json({ countries: cachedCountries });
    }

    // Fetch from Geonames API
    const response = await fetch(
      `http://api.geonames.org/countryInfoJSON?username=${GEONAMES_USERNAME}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch countries from Geonames" },
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

    // Cache countries in database
    const countries = await Promise.all(
      data.geonames.map(async (country: any) => {
        return prisma.country.upsert({
          where: { geonameId: country.geonameId },
          update: {
            countryCode: country.countryCode,
            countryName: country.countryName,
            continent: country.continentName,
            capital: country.capital,
            population: BigInt(country.population || 0),
          },
          create: {
            geonameId: country.geonameId,
            countryCode: country.countryCode,
            countryName: country.countryName,
            continent: country.continentName,
            capital: country.capital,
            population: BigInt(country.population || 0),
          },
        });
      })
    );

    return NextResponse.json({
      countries: countries.map((c) => ({
        id: c.id,
        countryCode: c.countryCode,
        countryName: c.countryName,
        geonameId: c.geonameId,
      })),
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
