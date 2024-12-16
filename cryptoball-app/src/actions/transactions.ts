export type Transaction = {
    address: string;
    abi: any;
    functionName: string;
    args?: any[];
    chainId: number;
    gas: bigint;
};