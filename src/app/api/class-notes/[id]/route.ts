import { NextRequest, NextResponse } from "next/server";
import { updateClassNote, deleteClassNote } from "@/lib/queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { text, isPinned } = body;

    const updateData: Record<string, any> = {};
    if (text !== undefined) updateData.text = text;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field is required to update" },
        { status: 400 }
      );
    }

    await updateClassNote(id, updateData);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating class note:", error);
    return NextResponse.json(
      { error: "Failed to update class note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteClassNote(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting class note:", error);
    return NextResponse.json(
      { error: "Failed to delete class note" },
      { status: 500 }
    );
  }
}
