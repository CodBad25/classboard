import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCategories, createCategory } from "@/lib/queries";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { label, color, icon, sortOrder } = body;

    if (!label || typeof label !== "string") {
      return NextResponse.json(
        { error: "label is required and must be a string" },
        { status: 400 }
      );
    }

    if (!color || typeof color !== "string") {
      return NextResponse.json(
        { error: "color is required and must be a string" },
        { status: 400 }
      );
    }

    if (!icon || typeof icon !== "string") {
      return NextResponse.json(
        { error: "icon is required and must be a string" },
        { status: 400 }
      );
    }

    const category = await createCategory({
      id: randomUUID(),
      label,
      color,
      icon,
      sortOrder: sortOrder ?? 0,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
