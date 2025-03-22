export type Transaction = {
    address: string;
    abi: any;
    functionName: string;
    args?: any[];
    value?: bigint;
    chainId: number;
    gas: bigint;
};