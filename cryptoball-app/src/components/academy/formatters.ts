import { nativeTokenSymbol } from "../../config/network";

export const formatPol = (value: bigint): string => `${(Number(value) / 1e18).toFixed(3)} ${nativeTokenSymbol}`;
