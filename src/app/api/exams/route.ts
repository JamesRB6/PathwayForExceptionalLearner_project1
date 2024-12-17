// app/api/exams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getExams, createExam } from "./data";

export async function GET() {
  try {
    const exams = await getExams();
    return NextResponse.json(exams, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, subject, date, questions } = await req.json();

    if (!title || !subject || !date) {
      return NextResponse.json(
        { error: "Missing required fields: title, subject, date" },
        { status: 400 }
      );
    }

    const newExam = await createExam(title, subject, date, questions || []);
    return NextResponse.json(newExam, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}
