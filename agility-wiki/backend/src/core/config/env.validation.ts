import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  OPENAI_API_KEY_SCRIPT: string;

  @IsString()
  @IsNotEmpty()
  PINECONE_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  PINECONE_INDEX: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}