import { Body, Controller, Post } from "@nestjs/common";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  async chat(
    @Body() body: { message: string; apiKey: string }
  ) {
    const answer = await this.chatService.chat(
      body.message,
      body.apiKey
    );

    return {
      text: answer,
    };
  }
}