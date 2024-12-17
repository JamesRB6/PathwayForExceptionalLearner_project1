// app/api/exams/data.ts (adjust path as needed)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export function getExam(id: string) {
  return prisma.exam.findUnique({
    where: { id: parseInt(id) },
    include: {
      questions: true,
    },
  });
}

export function getExams() {
  return prisma.exam.findMany({
    include: {
      questions: true,
    },
  });
}

export async function createExam(
  title: string,
  subject: string,
  date: string,
  questions: { questionText: string; markingCriteria?: string }[]
) {
  return prisma.exam.create({
    data: {
      title,
      subject,
      date: new Date(date),
      questions: {
        create: questions.map((q) => ({
          questionText: q.questionText,
          markingCriteria: q.markingCriteria || null,
        })),
      },
    },
    include: {
      questions: true,
    },
  });
}

// New: Update an existing exam (excluding adding/removing questions here for simplicity)
export async function updateExam(
  id: string,
  title?: string,
  subject?: string,
  date?: string
) {
  const data: any = {};
  if (title) data.title = title;
  if (subject) data.subject = subject;
  if (date) data.date = new Date(date);

  return prisma.exam.update({
    where: { id: parseInt(id) },
    data,
    include: { questions: true },
  });
}

// New: Delete an exam by ID
export async function deleteExam(id: string) {
  return prisma.exam.delete({
    where: { id: parseInt(id) },
  });
}
