import { useEffect, useMemo, useState } from "react";
import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

const SLTC_MINT = new PublicKey("Gzd3wZWCFToRnpmSqD1GaPsuT9ErfJ7G17ZZYNMs7D9c");

// Small card component
function Card({ title, children }) {
  return (
    <div className="w-full max-w-md rounded-2xl p-5 bg-zinc-900/60 ring-1 ring-white/10">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

// Shows SOL + sLTC balances
function Balances() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [sol, setSol] = useState(null);
  const [sltc, setSltc] = useState(null);

  useEffect(() => {
    if (!publicKey) {
      setSol(null);
      setSltc(null);
      return;
    }

    (async () => {
      // SOL
      const lamports = await connection.getBalance(publicKey, { commitment: "confirmed" });
      setSol(lamports / 1e9);

      // sLTC SPL token balance (using parsed token accounts)
      const resp = await connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: SLTC_MINT,
      });
      const amount =
        resp.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
      setSltc(amount);
    })();
  }, [publicKey, connection]);

  if (!publicKey) {
    return (
      <Card title="Balances">
        <p className="text-zinc-400">Connect a wallet to view balances.</p>
      </Card>
    );
  }

  return (
    <>
      <Card title="Wallet">
        <p className="text-sm break-all text-zinc-400">
          {publicKey.toBase58()}
        </p>
      </Card>

      <div className="grid gap-4 w-full max-w-md">
        <Card title="SOL">
          <p className="text-2xl">{sol === null ? "…" : sol.toFixed(4)} SOL</p>
        </Card>
        <Card title="sLTC">
          <p className="text-2xl">{sltc === null ? "…" : sltc}</p>
          <p className="text-xs text-zinc-400 mt-1">
            Mint: {SLTC_MINT.toBase58()}
          </p>
        </Card>
      </div>
    </>
  );
}

export default function App() {
  const endpoint = clusterApiUrl("devnet");
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col items-center gap-6 py-16">
            <h1 className="text-3xl font-bold">sLTC — Solana Wrapped Litecoin</h1>
            <WalletMultiButton />
            <Balances />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
