import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT ?? 8787);
const MEGAETH_RPC = process.env.MEGAETH_RPC ?? "https://carrot.megaeth.com/rpc";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export const config = {
  port: PORT,
  rpcUrl: MEGAETH_RPC,
  privateKey: PRIVATE_KEY,
  chainId: 6342,
};
