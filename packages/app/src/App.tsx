import CounterCard from "./components/CounterCard";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            MegaETH Live Counter
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Increment the counter with realtime confirmations powered by MegaETH testnet.
          </p>
        </header>
        <CounterCard />
        <footer className="text-center text-sm text-slate-500">
          Built with ❤️ for blazing-fast UX demos on MegaETH.
        </footer>
      </div>
    </div>
  );
}

export default App;
