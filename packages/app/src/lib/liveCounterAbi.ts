export const liveCounterAbi = [
  "function value() view returns (uint256)",
  "function increment()",
  "event Incremented(uint256 newValue, address indexed by)",
] as const;
