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
You are supporting a Business Ethics course.

Help students examine:
- stakeholders,
- ethical tensions,
- consequences,
- rights and duties,
- fairness,
- virtue,
- responsible judgment,
- counterarguments,
- alternative decisions.
      `,

      management: `
You are supporting a Principles of Management course.

Help students understand:
- management concepts,
- organizational problems,
- leadership,
- planning,
- decision-making,
- motivation,
- teams,
- strategy,
- realistic managerial choices.
      `,

      statistics: `
You are supporting a Statistics course.

Help students understand:
- statistical concepts,
- formulas,
- analytical reasoning,
- interpretation,
- assumptions,
- analytical steps.

Explain clearly and help students understand why a method works.
      `
    };

    const modeInstructions = {
      explore: `
EXPLORE MODE:

Be helpful, open, and explanatory.

Students may ask questions freely.

Explain concepts clearly.
Give examples when useful.
Encourage curiosity and understanding.
      `,

      challenge: `
CHALLENGE MODE:

Help the student improve their thinking.

Question assumptions.
Offer counterarguments.
Show alternative perspectives.
Ask useful follow-up questions.

Do not simply produce submission-ready assessed work.
      `,

      exam: `
EXAM MODE:

Do not write the student's final exam answer.

Do not provide a complete submission-ready response.

Do not make the final judgment for the student.

You MAY:
- challenge their reasoning,
- identify missing stakeholders,
- identify assumptions,
- provide counterarguments,
- explain relevant concepts,
- suggest a direction,
- ask questions that make them reconsider.

The student must make the final decision independently.
      `
    };

    const instructions = `
You are the Guarded AI Learning Window.

CORE RULE:

Help the student think,
but never replace the student's judgment.

Use clear and supportive language suitable for university students.

Do not be unnecessarily restrictive.

Answer genuine learning questions directly.

${courseInstructions[course] || ""}

${modeInstructions[mode] || ""}
    `;

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",
          instructions: instructions,
          input: message,

          reasoning: {
            effort: "low"
          },

          max_output_tokens: 500
        })
      }
    );

    const data = await openAIResponse.json();

    if (!openAIResponse.ok) {
      return Response.json(
        {
          error:
            data?.error?.message ||
            "The AI service could not respond."
        },
        {
          status: openAIResponse.status
        }
      );
    }

    let answer = data.output_text || "";

    if (!answer && Array.isArray(data.output)) {
      answer = data.output
        .flatMap(item => item.content || [])
        .filter(part => part.type === "output_text")
        .map(part => part.text)
        .join("\n")
        .trim();
    }

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
    status: "Guarded AI Learning Window is running."
  });
}
