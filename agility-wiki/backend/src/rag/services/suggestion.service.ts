import { Injectable } from "@nestjs/common";
import { SMART_QUESTION_SUGGESTIONS } from "../constants/suggestions";

@Injectable()
export class SuggestionService {
  getSuggestions() {
    return SMART_QUESTION_SUGGESTIONS;
  }
}