import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, type Content, type Part } from "@google/generative-ai";

import { requireRole } from "@/lib/auth";
import { adminTools, adminToolDeclarations } from "@/lib/agents/admin-tools";

const SYSTEM_PROMPT = `You are a helpful data analyst assistant for an employee timesheet and task-management platform called TimelineSheet.

You have access to tools that query the company database. When the user asks about employees, tasks, timesheets, attendance, or projects, use the appropriate tool to fetch real data. You may call multiple tools if needed.

After receiving tool results:
- Present the data in a clear, human-readable way with key highlights.
- Include specific numbers and percentages.
- When returning your response, also include a JSON block wrapped in \`\`\`tool_result markers so the UI can render rich data cards. Format: \`\`\`tool_result\n{"toolName":"<name>","data":<the raw tool result>}\n\`\`\`
- You can include multiple tool_result blocks if you called multiple tools.
- Keep your text response concise and insightful — act like a smart analyst, not a data dump.

If the user asks something that does not require data lookup, just answer conversationally.`;

const MAX_TOOL_ROUNDS = 5;

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: { messages: Array<{ role: string; content: string }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: adminToolDeclarations }],
  });

  // Build Gemini conversation history from client messages
  const history: Content[] = [];
  for (const msg of body.messages.slice(0, -1)) {
    history.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  const lastMessage = body.messages[body.messages.length - 1];
  const chat = model.startChat({ history });

  let result = await chat.sendMessage(lastMessage.content);
  let response = result.response;

  // Tool-call loop
  const toolResults: Array<{ toolName: string; data: unknown }> = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const candidate = response.candidates?.[0];
    if (!candidate) break;

    const functionCalls = candidate.content.parts.filter(
      (p: Part) => "functionCall" in p && p.functionCall
    );

    if (functionCalls.length === 0) break;

    const functionResponseParts: Part[] = [];

    for (const part of functionCalls) {
      if (!("functionCall" in part) || !part.functionCall) continue;
      const { name, args } = part.functionCall;
      const tool = adminTools[name];

      let toolResult: unknown;
      if (tool) {
        try {
          toolResult = await tool.execute((args as Record<string, unknown>) ?? {});
        } catch (err) {
          toolResult = {
            error: `Tool execution failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
      } else {
        toolResult = { error: `Unknown tool: ${name}` };
      }

      toolResults.push({ toolName: name, data: toolResult });

      functionResponseParts.push({
        functionResponse: {
          name,
          response: toolResult as object,
        },
      });
    }

    // Send tool results back to Gemini
    result = await chat.sendMessage(functionResponseParts);
    response = result.response;
  }

  const text = response.text();

  return NextResponse.json({
    role: "assistant",
    content: text,
    toolResults,
  });
}
