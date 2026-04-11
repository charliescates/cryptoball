export type Transaction = {
    address: string;
    abi: any;
    functionName: string;
    args?: any[];
    value?: bigint;
    chainId: number;
};

/**
 * Check if the current chain is Polygon Amoy (chain ID 80002)
 */
export function isPolygonAmoy(chainId?: number): boolean {
    return chainId === 80002;
}