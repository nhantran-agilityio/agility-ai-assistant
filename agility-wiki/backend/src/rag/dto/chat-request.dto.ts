import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({
    example: 'who is Nhàn?',
  })
  message: string;

  @ApiProperty({
    example: 'sk-xxxx',
  })
  apiKey: string;
}
