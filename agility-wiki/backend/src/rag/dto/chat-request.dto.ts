import { ApiProperty } from "@nestjs/swagger";

export class ChatRequestDto {
  @ApiProperty({
    example: "who works in LN team?",
  })
  message: string;
  apiKey: string;
}