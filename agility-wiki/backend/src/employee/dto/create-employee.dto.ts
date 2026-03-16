import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'Nhan',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Backend Engineer',
  })
  @IsOptional()
  @IsString()
  job_title?: string;

  @ApiProperty({
    example: 'nhan@agility.io',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Da Nang',
  })
  @IsString()
  work_location: string;

  @ApiProperty({
    example: 'active',
  })
  @IsString()
  status: string;

  @ApiProperty({
    example: '0123456789',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'team-id',
    required: false,
  })
  @IsOptional()
  teamId?: string;
}
