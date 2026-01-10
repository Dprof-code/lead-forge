import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessType,
      city,
      state,
      country,
      customZips,
      geonameId,
      latitude,
      longitude,
    } = body;

    if (!businessType || !city) {
      return NextResponse.json(
        { error: "Business type and city are required" },
        { status: 400 }
      );
    }

    console.log("received body: ", body);

    // Create job record
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        type: "query_generator",
        status: "running",
        config: {
          businessType,
          city,
          state: state || "ID",
          country: country || "US",
          customZips: customZips || null,
          geonameId: geonameId || null,
          latitude: latitude || null,
          longitude: longitude || null,
        },
      },
    });

    // Prepare output file path
    const outputDir = path.join(process.cwd(), "public", "downloads");
    await fs.mkdir(outputDir, { recursive: true });
    const outputFile = path.join(outputDir, `queries_${job.id}.csv`);

    // Prepare Python script arguments
    const scriptArgs = JSON.stringify({
      businessType,
      city,
      state: state || "ID",
      country: country || "US",
      customZips: customZips || null,
      geonameId: geonameId || null,
      latitude: latitude || null,
      longitude: longitude || null,
      outputFile,
    });

    // Execute Python script
    const pythonScript = path.join(
      process.cwd(),
      "python",
      "query_generator.py"
    );

    return new Promise<Response>((resolve) => {
      const python = spawn("python", [pythonScript, scriptArgs], {
        env: {
          ...process.env,
          GEONAMES_USERNAME: process.env.GEONAMES_USERNAME || "demo",
        },
      });
      let output = "";
      let errorOutput = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
        console.log("[Python STDOUT]:", data.toString());
      });

      python.stderr.on("data", (data) => {
        errorOutput += data.toString();
        console.error("[Python STDERR]:", data.toString());
      });

      python.on("close", async (code) => {
        try {
          if (code !== 0) {
            await prisma.job.update({
              where: { id: job.id },
              data: {
                status: "failed",
                error: errorOutput || "Python script failed",
                completedAt: new Date(),
              },
            });

            resolve(
              NextResponse.json(
                { error: "Failed to generate queries", details: errorOutput },
                { status: 500 }
              )
            );
            return;
          }

          // Parse Python output
          const result = JSON.parse(output);

          if (!result.success) {
            await prisma.job.update({
              where: { id: job.id },
              data: {
                status: "failed",
                error: result.error,
                completedAt: new Date(),
              },
            });

            resolve(
              NextResponse.json({ error: result.error }, { status: 500 })
            );
            return;
          }

          // Update job with results
          await prisma.job.update({
            where: { id: job.id },
            data: {
              status: "completed",
              progress: 100,
              total: result.count,
              result: {
                count: result.count,
                preview: result.queries,
              },
              outputFile: `/api/download/queries_${job.id}.csv`,
              completedAt: new Date(),
            },
          });

          resolve(
            NextResponse.json({
              success: true,
              jobId: job.id,
              count: result.count,
              preview: result.queries,
              downloadUrl: `/api/download/queries_${job.id}.csv`,
            })
          );
        } catch (error) {
          console.error("Error processing Python output:", error);

          await prisma.job.update({
            where: { id: job.id },
            data: {
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
              completedAt: new Date(),
            },
          });

          resolve(
            NextResponse.json(
              { error: "Failed to process results" },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error("Query generator error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all query generator jobs for the current user
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.job.findMany({
      where: {
        userId: session.user.id,
        type: "query_generator",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
