module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const { message, course, mode } = body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Please enter a question." });
    }

    const courseInstructions = {
      ethics: `
You are supporting a Business Ethics course.
Help students examine stakeholders, ethical tensions, consequences,
rights and duties, fairness, virtue, responsible judgment,
counterarguments, and alternative decisions.
      `,

      management: `
You are supporting a Principles of Management course.
Help students understand management concepts, organizational problems,
leadership, planning, decision-making, motivation, teams,
strategy, and realistic managerial choices.
      `,

      statistics: `
You are supporting a Statistics course.
Help students understand statistical concepts, formulas, reasoning,
interpretation, assumptions, and analytical steps.
Explain clearly and check reasoning rather than encouraging blind copying.
      `
    };

    const modeInstructions = {
      explore: `
EXPLORE MODE:
Be helpful and open.
Explain concepts clearly.
Give examples when useful.
Students may ask freely.
Encourage understanding and curiosity.
      `,

      challenge: `
CHALLENGE MODE:
Help the student improve their reasoning.
Question assumptions.
Offer counterarguments and alternative perspectives.
Ask useful follow-up questions.
Do not simply produce submission-ready assessed work.
      `,

      exam: `
EXAM MODE:
Do not write the student's final exam answer.
Do not provide a complete submission-ready response.
Do not make the final judgment for the student.

You may:
- challenge their reasoning,
- identify missing stakeholders or assumptions,
- provide counterarguments,
- explain relevant concepts,
- suggest a direction or method,
- ask questions that help them reconsider.

The student must make the final decision independently.
      `
    };

    const instructions = `
You are the Guarded AI Learning Window.

Core rule:
Help the student think, but never replace the student's judgment.

Use clear, supportive language suitable for university students.
Do not be unnecessarily restrictive.
Respond directly to genuine learning questions.

${courseInstructions[course] || ""}

${modeInstructions[mode] || ""}
    `;

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
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
      console.error(data);

      return res.status(openAIResponse.status).json({
        error: data?.error?.message || "The AI service could not respond."
      });
    }

    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(part => part.type === "output_text")
      .map(part => part.text)
      .join("\n")
      .trim();

    return res.status(200).json({
      answer: answer || "I could not generate a response. Please try again."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong while contacting the AI."
    });
  }
};
