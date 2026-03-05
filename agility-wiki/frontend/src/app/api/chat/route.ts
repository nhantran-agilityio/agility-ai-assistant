export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const lastMessage = messages[messages.length - 1]?.content;

    if (!lastMessage) {
      return new Response("No message provided", { status: 400 });
    }

    // Call NestJS backend
    const backendResponse = await fetch(
      "http://localhost:3000/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: lastMessage,
        }),
      }
    );

    if (!backendResponse.ok) {
      return new Response("Backend error", { status: 500 });
    }

    const data = await backendResponse.json();
    const answer =
      data.answer ?? "I don't have enough information.";

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // send text
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "text-delta",
              text: answer,
            })}\n\n`
          )
        );

        // finish event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "finish",
            })}\n\n`
          )
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}