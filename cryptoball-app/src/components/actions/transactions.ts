import { activeChain } from "../../config/network";

export type Transaction = {
    address: string;
    abi: any;
    functionName: string;
    args?: any[];
    value?: bigint;
    chainId: number;
};

/**
 * Check if the current chain matches the currently configured app network.
 */
export function isPolygon(chainId?: number): boolean {
    return chainId === activeChain.id;
}