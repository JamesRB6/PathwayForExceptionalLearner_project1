// app/api/exams/data.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export function getExam(id: string) {
  return prisma.exam.findUnique({
    where: { id: parseInt(id) },
    include: { questions: true },
  });
}

export function getExams() {
  return prisma.exam.findMany({
    include: { questions: true },
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
    include: { questions: true },
  });
}

// Updated updateExam to handle questions
export async function updateExam(
  id: string,
  title?: string,
  subject?: string,
  date?: string,
  questions?: { id?: number; questionText: string; markingCriteria?: string }[]
) {
  const examId = parseInt(id);
  const data: any = {};

  if (title) data.title = title;
  if (subject) data.subject = subject;
  if (date) data.date = new Date(date);

  if (questions) {
    const existingExam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });
    if (!existingExam) throw new Error("Exam not found");

    const existingIds = new Set(existingExam.questions.map((q) => q.id));
    const inputIds = new Set(questions.filter((q) => q.id).map((q) => q.id!));
    const toDelete = [...existingIds].filter((id) => !inputIds.has(id));

    data.questions = {
      deleteMany: toDelete.map((id) => ({ id })),
      upsert: questions
        .filter((q) => q.id)
        .map((q) => ({
          where: { id: q.id! },
          update: {
            questionText: q.questionText,
            markingCriteria: q.markingCriteria || null,
          },
          create: {
            questionText: q.questionText,
            markingCriteria: q.markingCriteria || null,
          },
        })),
      create: questions
        .filter((q) => !q.id)
        .map((q) => ({
          questionText: q.questionText,
          markingCriteria: q.markingCriteria || null,
        })),
    };
  }

  return prisma.exam.update({
    where: { id: examId },
    data,
    include: { questions: true },
  });
}

export async function deleteExam(id: string) {
  return prisma.exam.delete({
    where: { id: parseInt(id) },
  });
}
