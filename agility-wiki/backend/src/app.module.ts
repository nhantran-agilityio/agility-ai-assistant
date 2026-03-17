import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validate } from './core/config/env.validation';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { RagModule } from './rag/rag.module';
import { PrismaModule } from './database/prisma.module';
import { EmployeeModule } from './employee/employee.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    AuthModule,
    RagModule,
    EmployeeModule,
    TeamModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
