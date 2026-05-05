import { isAddress, keccak256, type Hex } from "viem";
import adjectives from "../../resources/team_adjectives.json";
import nouns from "../../resources/team_nouns.json";
import endings from "../../resources/team_endings.json";

function fallbackName(address: string): string {
  if (!address) {
    return "Unknown Team";
  }

  if (address.length < 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function generateName(address: string): string {
  if (!isAddress(address)) {
    return fallbackName(address);
  }

  const hash = keccak256(address as Hex);

  const adjIndex = Number(BigInt(`0x${hash.slice(2, 18)}`) % BigInt(adjectives.length));
  const nounIndex = Number(BigInt(`0x${hash.slice(18, 34)}`) % BigInt(nouns.length));
  const endingIndex = Number(BigInt(`0x${hash.slice(34, 50)}`) % BigInt(endings.length));

  const short = `#${address.slice(2, 6).toUpperCase()}`;

  return `${adjectives[adjIndex]} ${nouns[nounIndex]} ${endings[endingIndex]} ${short}`;
}