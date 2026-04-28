export type Transaction = {
    address: string;
    abi: any;
    functionName: string;
    args?: any[];
    value?: bigint;
    chainId: number;
};

/**
 * Check if the current chain is Polygon PoS mainnet (chain ID 137)
 */
export function isPolygon(chainId?: number): boolean {
    return chainId === 137;
}