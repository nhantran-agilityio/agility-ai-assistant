import { ApiProperty } from '@nestjs/swagger';

export class IngestRequestDto {
  @ApiProperty({
    example: 'sk-xxxx',
    description: 'User OpenAI API key',
  })
  apiKey: string;
}
