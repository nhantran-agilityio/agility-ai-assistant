import { Controller, Get } from '@nestjs/common';
import { TeamService } from './team.service';

@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  getTeams() {
    return this.teamService.findAll();
  }
}
