// app/api/exams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getExam, updateExam, deleteExam } from "../data";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exam = await getExam(params.id);

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(exam, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch exam" }, { status: 500 });
  }
}

// PUT: Update an existing exam
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, subject, date } = await req.json();

    const existingExam = await getExam(params.id);
    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const updatedExam = await updateExam(params.id, title, subject, date);
    return NextResponse.json(updatedExam, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update exam" }, { status: 500 });
  }
}

// DELETE: Delete an exam
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingExam = await getExam(params.id);
    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    await deleteExam(params.id);
    return NextResponse.json({ message: "Exam deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}
