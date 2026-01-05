import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const GEONAMES_USERNAME = process.env.GEONAMES_USERNAME || "demo";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get("stateCode");
    const countryCode = searchParams.get("countryCode");

    if (!stateCode || !countryCode) {
      return NextResponse.json(
        { error: "State code and country code are required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedCities = await prisma.city.findMany({
      where: {
        stateCode,
        countryCode,
      },
      orderBy: { cityName: "asc" },
      select: {
        id: true,
        cityName: true,
        geonameId: true,
        latitude: true,
        longitude: true,
        population: true,
      },
    });

    if (cachedCities.length > 0) {
      return NextResponse.json({ cities: cachedCities });
    }

    // Get state from database
    const state = await prisma.state.findFirst({
      where: {
        stateCode,
        countryCode,
      },
    });

    if (!state) {
      return NextResponse.json({ error: "State not found" }, { status: 404 });
    }

    // Fetch cities from Geonames
    const response = await fetch(
      `http://api.geonames.org/searchJSON?country=${countryCode}&adminCode1=${stateCode}&featureClass=P&maxRows=1000&username=${GEONAMES_USERNAME}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch cities from Geonames" },
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

    // Cache cities
    const cities = await Promise.all(
      data.geonames.map(async (city: any) => {
        try {
          return await prisma.city.upsert({
            where: { geonameId: city.geonameId },
            update: {
              cityName: city.name,
              stateCode,
              countryCode,
              latitude: city.lat ? parseFloat(city.lat) : null,
              longitude: city.lng ? parseFloat(city.lng) : null,
              population: city.population || null,
            },
            create: {
              geonameId: city.geonameId,
              cityName: city.name,
              stateCode,
              countryCode,
              stateId: state.id,
              latitude: city.lat ? parseFloat(city.lat) : null,
              longitude: city.lng ? parseFloat(city.lng) : null,
              population: city.population || null,
            },
          });
        } catch (error: any) {
          // Skip duplicate cities (same name in same state/country)
          if (error.code === "P2002") {
            console.log(
              `Skipping duplicate city: ${city.name} in ${stateCode}, ${countryCode}`
            );
            // Return existing city instead
            return await prisma.city.findFirst({
              where: {
                cityName: city.name,
                stateCode,
                countryCode,
              },
            });
          }
          throw error;
        }
      })
    );

    // Filter out null values (failed inserts)
    const validCities = cities.filter((c) => c !== null);

    return NextResponse.json({
      cities: validCities.map((c) => ({
        id: c.id,
        cityName: c.cityName,
        geonameId: c.geonameId,
        latitude: c.latitude,
        longitude: c.longitude,
        population: c.population,
      })),
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
