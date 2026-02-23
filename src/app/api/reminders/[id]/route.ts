import { NextRequest, NextResponse } from "next/server";
import { updateReminder, toggleReminder, deleteReminder } from "@/lib/queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { toggleDone, text, categoryId, dueDate } = body;

    if (toggleDone === true) {
      await toggleReminder(id);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const updateData: Record<string, any> = {};
    if (text !== undefined) updateData.text = text;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field is required to update or toggleDone must be true" },
        { status: 400 }
      );
    }

    await updateReminder(id, updateData);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
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
    await deleteReminder(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
