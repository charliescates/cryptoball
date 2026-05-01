export interface MatchTeam {
  attackingPlayers: bigint[];
  midfieldPlayers: bigint[];
  defensivePlayers: bigint[];
}

export interface MatchDetails {
  homeAddress: string;
  homeTeam: MatchTeam;
  awayAddress: string;
  awayTeam: MatchTeam;
  wagerRequired: bigint;
  pot: bigint;
}

export interface GameResultScore {
  homeScore: number;
  awayScore: number;
}
