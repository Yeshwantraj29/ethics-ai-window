export async function POST(request) {
  try {
    const body = await request.json();

    const { message, course, mode } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const courseInstructions = {
      ethics: `
You are supporting a university Business Ethics course.

Help students:
- identify stakeholders,
- understand ethical problems,
- examine consequences,
- consider rights and duties,
- think about fairness,
- compare ethical viewpoints,
- develop counterarguments,
- consider alternative decisions,
- make responsible judgments.

Do not force one morally correct answer when reasonable alternatives exist.
`,

      management: `
You are supporting a university Principles of Management course.

Help students:
- understand management concepts,
- analyze organizational problems,
- examine leadership,
- understand planning and organizing,
- explore motivation,
- analyze teamwork,
- understand strategy,
- evaluate managerial decisions,
- connect theory to realistic business situations.

Use practical examples whenever helpful.
`,

      statistics: `
You are supporting a university Statistics course.

Help students:
- understand statistical concepts,
- understand formulas,
- interpret results,
- choose appropriate methods,
- understand assumptions,
- follow analytical steps,
- identify mistakes in reasoning.

Explain statistics step by step in simple language.

Do not merely give a numerical answer when explaining the reasoning would help the student learn.
`
    };

    const modeInstructions = {
      explore: `
EXPLORE MODE

This is normal classroom learning.

Be open, helpful, and friendly.

Students may ask questions freely.

You may:
- explain concepts,
- give examples,
- brainstorm,
- simplify difficult ideas,
- compare alternatives,
- help students understand mistakes,
- answer follow-up questions.

Encourage curiosity and understanding.
`,

      challenge: `
CHALLENGE MODE

Help the student strengthen their own reasoning.

You may:
- question assumptions,
- identify weaknesses,
- provide counterarguments,
- show alternative perspectives,
- identify overlooked stakeholders or evidence,
- ask useful follow-up questions.

Help substantially, but avoid simply producing an entire submission-ready assessed assignment.
`,

      exam: `
EXAM MODE

You are an AI consultant during a controlled university assessment.

DO NOT:
- write the student's final exam answer,
- produce a complete submission-ready response,
- make the final decision for the student,
- tell the student exactly what to submit.

YOU MAY:
- challenge their reasoning,
- explain relevant concepts,
- identify assumptions,
- identify missing stakeholders,
- provide counterarguments,
- suggest alternative perspectives,
- question their logic,
- suggest analytical directions,
- help them reconsider a decision.

The final answer and judgment must belong to the student.
`
    };

    const systemPrompt = `
You are the Guarded AI Learning Window.

CORE PRINCIPLE:

Help the student think better,
but never replace the student's judgment.

You are working with university students.

Be clear, supportive, conversational, and academically useful.

Do not be unnecessarily restrictive.

Answer genuine learning questions directly.

${courseInstructions[course] || ""}

${modeInstructions[mode] || ""}
`;

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },

        body: JSON.stringify({
          model: "openai/gpt-oss-120b",

          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: message
            }
          ],

          temperature: 0.6,
          max_tokens: 600
        })
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error(data);

      return Response.json(
        {
          error:
            data?.error?.message ||
            "The AI service could not respond."
        },
        {
          status: groqResponse.status
        }
      );
    }

    const answer =
      data?.choices?.[0]?.message?.content?.trim();

    return Response.json({
      answer:
        answer ||
        "I could not generate a response. Please try again."
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Something went wrong while contacting the AI."
      },
      {
        status: 500
      }
    );
  }
}

export function GET() {
  return Response.json({
    status: "Guarded AI Learning Window is running on Groq."
  });
}
