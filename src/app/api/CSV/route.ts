import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { questionsAndCriteria, question, answer, batch } = await request.json();
    
    // Decide whether we have any real criteria or not.
    const hasCriteria = questionsAndCriteria && questionsAndCriteria.trim().length > 0;
    
    // Build a custom prompt based on whether there is criteria
    const prompt = hasCriteria
      ? `
Question and Students response (For each /n give feedback, ignore studentID): ${batch}

Question followed by Marking Criteria:
---
${questionsAndCriteria}
---
`
      : `
Question and Students response (For each /n give feedback, ignore studentID): ${batch}

(No marking criteria was provided. Mark as normal.)
`;

    const messages = [
      {
        role: "system",
        content: `
You are a university tutor marking exam responses. You must provide concise and insightful feedback with a mark out of 0–5. 

Instructions:
1. Read the student's response to the question(s).
2. If marking criteria is provided, you must refer to it explicitly and indicate how the student's response meets or falls short of those criteria.
3. If no marking criteria is provided, simply provide normal feedback and a mark out of 5.
4. Provide a single blank line between feedback for each answer.

Example: 
2/5 - The explanation of symmetric encryption is mostly correct, but the claim that it is not secure for communication is misleading. Asymmetric encryption is not inherently more secure in all contexts, and the response lacks depth in explaining the implications of each type.
1/5 - ... 
Note: Your response should only have a single new line between each feedback.
        `,
      },
      { role: "user", content: prompt },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Example only
        messages: messages,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);
      throw new Error(errorData.error.message);
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;

    return NextResponse.json({ message: feedback });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
