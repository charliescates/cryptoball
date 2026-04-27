export interface MatchDetails {
  homeAddress: string;
  awayAddress: string;
  wagerRequired: bigint;
  pot: bigint;
}

export interface GameResultScore {
  homeScore: number;
  awayScore: number;
}
