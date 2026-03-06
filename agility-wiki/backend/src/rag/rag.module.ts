import { Module } from "@nestjs/common";
import { RagService } from "./rag.service";
import { EmbeddingService } from "./embedding.service";



@Module({
  providers: [
    RagService,
    EmbeddingService,
  ],
  exports: [RagService]
})
export class RagModule {}