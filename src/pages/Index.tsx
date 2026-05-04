import { useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

type Page = "home" | "miner" | "withdraw" | "donate" | "admin" | "profile" | "history";

interface Transaction {
  id: number;
  type: "win" | "loss" | "deposit" | "withdraw" | "donate";
  amount: number;
  description: string;
  date: Date;
}

const INITIAL_BALANCE = 500;

export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [bet, setBet] = useState(10);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, type: "deposit", amount: 500, description: "Начальный баланс", date: new Date(Date.now() - 86400000 * 2) },
  ]);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [revealed, setRevealed] = useState<number[]>([]);
  const [mines, setMines] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [coinFlies, setCoinFlies] = useState<number[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCard, setWithdrawCard] = useState("");
  const [donateAmount, setDonateAmount] = useState(100);

  const addTransaction = useCallback((tx: Omit<Transaction, "id" | "date">) => {
    setTransactions(prev => [
      { ...tx, id: Date.now(), date: new Date() },
      ...prev,
    ]);
  }, []);

  const startGame = () => {
    if (bet > balance) return;
    const newMines: number[] = [];
    while (newMines.length < 5) {
      const n = Math.floor(Math.random() * 25);
      if (!newMines.includes(n)) newMines.push(n);
    }
    setMines(newMines);
    setRevealed([]);
    setMultiplier(1);
    setGameState("playing");
    setBalance(prev => prev - bet);
    addTransaction({ type: "loss", amount: bet, description: `Ставка в игре (${bet} ₽)` });
  };

  const revealCell = (idx: number) => {
    if (gameState !== "playing" || revealed.includes(idx)) return;

    if (mines.includes(idx)) {
      setGameState("lost");
      setRevealed(prev => [...prev, idx, ...mines]);
    } else {
      const newRevealed = [...revealed, idx];
      setRevealed(newRevealed);
      const safeCount = newRevealed.length;
      const newMultiplier = parseFloat((1 + safeCount * 0.3).toFixed(2));
      setMultiplier(newMultiplier);
      setCoinFlies(prev => [...prev, idx]);
      setTimeout(() => setCoinFlies(prev => prev.filter(i => i !== idx)), 600);

      if (safeCount === 20) {
        const winAmount = Math.floor(bet * newMultiplier);
        setGameState("won");
        setBalance(prev => prev + winAmount);
        addTransaction({ type: "win", amount: winAmount, description: `Победа! ×${newMultiplier}` });
      }
    }
  };

  const cashOut = () => {
    if (gameState !== "playing" || revealed.length === 0) return;
    const winAmount = Math.floor(bet * multiplier);
    setGameState("won");
    setBalance(prev => prev + winAmount);
    addTransaction({ type: "win", amount: winAmount, description: `Забрал выигрыш ×${multiplier}` });
  };

  const resetGame = () => {
    setGameState("idle");
    setRevealed([]);
    setMines([]);
    setMultiplier(1);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 100 || amount > balance || !withdrawCard) return;
    setBalance(prev => prev - amount);
    addTransaction({ type: "withdraw", amount: amount, description: `Вывод на карту ***${withdrawCard.slice(-4)}` });
    setWithdrawAmount("");
    setWithdrawCard("");
  };

  const handleDonate = () => {
    if (donateAmount > balance) return;
    setBalance(prev => prev - donateAmount);
    addTransaction({ type: "donate", amount: donateAmount, description: "Донат проекту 💎" });
  };

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "home", label: "Главная", icon: "Home" },
    { id: "miner", label: "Майнер", icon: "Pickaxe" },
    { id: "withdraw", label: "Вывод", icon: "ArrowDownToLine" },
    { id: "donate", label: "Донат", icon: "Heart" },
    { id: "history", label: "История", icon: "History" },
    { id: "profile", label: "Профиль", icon: "User" },
    { id: "admin", label: "Админ", icon: "Shield" },
  ];

  const txColors: Record<Transaction["type"], string> = {
    win: "text-emerald-400",
    loss: "text-red-400",
    deposit: "text-sky-400",
    withdraw: "text-yellow-400",
    donate: "text-purple-400",
  };

  const txIcons: Record<Transaction["type"], string> = {
    win: "TrendingUp",
    loss: "TrendingDown",
    deposit: "PlusCircle",
    withdraw: "ArrowDownToLine",
    donate: "Heart",
  };

  const formatCurrency = (n: number) => n.toLocaleString("ru-RU") + " ₽";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--dark-bg)", backgroundImage: "linear-gradient(rgba(255,215,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.025) 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
      {/* TOP HEADER */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]"
        style={{ background: "rgba(10,12,20,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⛏️</span>
          <span className="font-russo text-lg neon-text-gold tracking-wider">МАЙНЕР</span>
        </div>
        <div className="px-4 py-2 rounded-xl flex items-center gap-2 border border-yellow-400/20"
          style={{ background: "rgba(255,215,0,0.06)" }}>
          <Icon name="Coins" size={16} className="text-yellow-400" />
          <span className="font-russo text-base neon-text-gold">{formatCurrency(balance)}</span>
        </div>
        <button
          onClick={() => setPage("profile")}
          className="w-9 h-9 rounded-full border border-[var(--card-border)] flex items-center justify-center hover:border-yellow-400 transition-colors">
          <Icon name="User" size={16} className="text-gray-400" />
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">

        {/* ── HOME ── */}
        {page === "home" && (
          <div className="animate-fade-in space-y-5 max-w-lg mx-auto">
            <div className="card-dark p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.08) 0%, transparent 70%)" }} />
              <div className="text-6xl mb-3 animate-glow-pulse">⛏️</div>
              <h1 className="font-russo text-3xl neon-text-gold mb-1">CRYPTO MINER</h1>
              <p className="text-gray-400 text-sm mb-4">Открывай клетки. Множь ставку. Не взорвись.</p>
              <button
                onClick={() => setPage("miner")}
                className="w-full py-3 rounded-xl font-russo text-lg tracking-wide transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)", color: "#0A0C14" }}>
                🎮 ИГРАТЬ
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Баланс", value: formatCurrency(balance), icon: "Wallet", color: "#FFD700" },
                { label: "Игр", value: transactions.filter(t => t.type === "win" || t.type === "loss").length, icon: "Gamepad2", color: "#00FF88" },
                { label: "Побед", value: transactions.filter(t => t.type === "win").length, icon: "Trophy", color: "#A855F7" },
              ].map((s) => (
                <div key={s.label} className="card-dark p-3 text-center">
                  <Icon name={s.icon} size={20} style={{ color: s.color }} className="mx-auto mb-1" />
                  <div className="font-russo text-sm" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Вывод средств", icon: "ArrowDownToLine", page: "withdraw" as Page, color: "#FFD700" },
                { label: "История игр", icon: "History", page: "history" as Page, color: "#00FF88" },
                { label: "Поддержать", icon: "Heart", page: "donate" as Page, color: "#A855F7" },
                { label: "Профиль", icon: "User", page: "profile" as Page, color: "#00BFFF" },
              ].map((a) => (
                <button key={a.label} onClick={() => setPage(a.page)}
                  className="card-dark p-4 flex items-center gap-3 rounded-xl hover:scale-105 transition-transform text-left"
                  style={{ borderColor: `${a.color}22` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${a.color}18` }}>
                    <Icon name={a.icon} size={18} style={{ color: a.color }} />
                  </div>
                  <span className="font-medium text-sm text-gray-300">{a.label}</span>
                </button>
              ))}
            </div>

            {transactions.length > 0 && (
              <div className="card-dark p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-russo text-sm text-gray-300">ОПЕРАЦИИ</span>
                  <button onClick={() => setPage("history")} className="text-xs text-yellow-400 hover:text-yellow-300">Все →</button>
                </div>
                <div className="space-y-2">
                  {transactions.slice(0, 3).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <Icon name={txIcons[tx.type]} size={13} className={txColors[tx.type]} />
                        <span className="text-xs text-gray-400">{tx.description}</span>
                      </div>
                      <span className={`text-xs font-russo ${txColors[tx.type]}`}>
                        {tx.type === "win" || tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MINER ── */}
        {page === "miner" && (
          <div className="animate-fade-in space-y-4 max-w-lg mx-auto">
            <div className="grid grid-cols-3 gap-3">
              <div className="card-dark p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">СТАВКА</div>
                <div className="font-russo neon-text-gold text-base">{formatCurrency(bet)}</div>
              </div>
              <div className="card-dark p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">МНОЖИТЕЛЬ</div>
                <div className={`font-russo text-base ${multiplier > 1.5 ? "neon-text-green" : "text-white"}`}>×{multiplier.toFixed(2)}</div>
              </div>
              <div className="card-dark p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">ВЫИГРЫШ</div>
                <div className="font-russo neon-text-gold text-base">{formatCurrency(Math.floor(bet * multiplier))}</div>
              </div>
            </div>

            {gameState === "idle" && (
              <div className="card-dark p-4 animate-scale-in">
                <div className="text-xs text-gray-500 mb-3 font-russo">ВЫБЕРИ СТАВКУ</div>
                <div className="flex gap-2 flex-wrap mb-3">
                  {[10, 25, 50, 100, 200, 500].map(b => (
                    <button key={b} onClick={() => setBet(b)} disabled={b > balance}
                      className={`px-3 py-1.5 rounded-lg text-sm font-russo transition-all border ${bet === b
                        ? "border-yellow-400 text-yellow-400"
                        : "border-[var(--card-border)] text-gray-400 hover:border-gray-500"
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                      style={bet === b ? { boxShadow: "0 0 8px rgba(255,215,0,0.4)" } : {}}>
                      {b} ₽
                    </button>
                  ))}
                </div>
                <button onClick={startGame} disabled={bet > balance}
                  className="w-full py-3 rounded-xl font-russo text-base tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)", color: "#0A0C14" }}>
                  ⛏️ НАЧАТЬ ИГРУ
                </button>
              </div>
            )}

            {gameState === "won" && (
              <div className="card-dark p-4 text-center border border-emerald-400/50 animate-scale-in"
                style={{ boxShadow: "0 0 20px rgba(0,255,136,0.2)" }}>
                <div className="text-3xl mb-1">🏆</div>
                <div className="font-russo neon-text-green text-lg">ПОБЕДА!</div>
                <div className="text-sm text-gray-400">+{formatCurrency(Math.floor(bet * multiplier))}</div>
              </div>
            )}
            {gameState === "lost" && (
              <div className="card-dark p-4 text-center border border-red-500/50 animate-scale-in"
                style={{ boxShadow: "0 0 20px rgba(255,68,68,0.2)" }}>
                <div className="text-3xl mb-1">💥</div>
                <div className="font-russo text-red-400 text-lg">ВЗРЫВ!</div>
                <div className="text-sm text-gray-400">Удачи в следующий раз</div>
              </div>
            )}

            <div className="card-dark p-4">
              <div className="text-xs text-gray-500 mb-3 font-russo flex items-center justify-between">
                <span>ПОЛЕ 5×5 — 5 МИН</span>
                {gameState === "playing" && (
                  <span className="text-emerald-400 text-xs">✓ {revealed.length} открыто</span>
                )}
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                {Array.from({ length: 25 }, (_, i) => {
                  const isRevealed = revealed.includes(i);
                  const isMine = mines.includes(i) && isRevealed;
                  const isSafe = isRevealed && !isMine;
                  const isCoinFlying = coinFlies.includes(i);
                  return (
                    <div key={i} className="relative">
                      <button onClick={() => revealCell(i)}
                        className={`mine-cell w-full aspect-square rounded-lg border text-xl flex items-center justify-center font-bold
                          ${gameState === "idle"
                            ? "border-[var(--card-border)] bg-[#1a1f30] opacity-40 cursor-not-allowed"
                            : isMine
                              ? "revealed-bomb border"
                              : isSafe
                                ? "revealed-safe border"
                                : "border-[var(--card-border)] bg-[#1a1f30] hover:bg-[#1e2440]"
                          }`}>
                        {isMine ? "💣" : isSafe ? "💎" : gameState !== "idle" ? "❓" : ""}
                      </button>
                      {isCoinFlying && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-sm pointer-events-none animate-coin-fly z-10">💰</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {gameState === "playing" && revealed.length > 0 && (
              <button onClick={cashOut}
                className="w-full py-3 rounded-xl font-russo text-base tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 animate-scale-in"
                style={{ background: "linear-gradient(135deg, #00FF88, #00CC66)", color: "#0A0C14" }}>
                💰 ЗАБРАТЬ {formatCurrency(Math.floor(bet * multiplier))}
              </button>
            )}

            {(gameState === "won" || gameState === "lost") && (
              <button onClick={resetGame}
                className="w-full py-3 rounded-xl font-russo text-base tracking-wide border border-[var(--card-border)] text-gray-300 hover:border-yellow-400 hover:text-yellow-400 transition-all">
                🔄 НОВАЯ ИГРА
              </button>
            )}

            <div className="card-dark p-4 text-xs text-gray-500 space-y-1">
              <div className="font-russo text-gray-400 mb-2">ПРАВИЛА</div>
              <div>• Поле 5×5 = 25 клеток, 5 из них — мины</div>
              <div>• Каждая безопасная клетка увеличивает множитель на ×0.30</div>
              <div>• Нажми «Забрать» в любой момент, чтобы зафиксировать выигрыш</div>
              <div>• Минимальная ставка: 10 ₽</div>
            </div>
          </div>
        )}

        {/* ── WITHDRAW ── */}
        {page === "withdraw" && (
          <div className="animate-fade-in space-y-4 max-w-lg mx-auto">
            <div className="card-dark p-5">
              <div className="flex items-center gap-2 mb-5">
                <Icon name="ArrowDownToLine" size={20} className="text-yellow-400" />
                <h2 className="font-russo text-lg text-white">ВЫВОД СРЕДСТВ</h2>
              </div>
              <div className="p-4 rounded-xl mb-5 text-center border border-yellow-400/20"
                style={{ background: "rgba(255,215,0,0.05)" }}>
                <div className="text-xs text-gray-500 mb-1">Доступно к выводу</div>
                <div className="font-russo text-2xl neon-text-gold">{formatCurrency(balance)}</div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-russo block mb-1">НОМЕР КАРТЫ</label>
                  <input value={withdrawCard} onChange={e => setWithdrawCard(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    placeholder="0000 0000 0000 0000"
                    className="w-full bg-[#1a1f30] border border-[var(--card-border)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-russo block mb-1">СУММА (минимум 100 ₽)</label>
                  <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                    type="number" min={100} max={balance} placeholder="Введите сумму"
                    className="w-full bg-[#1a1f30] border border-[var(--card-border)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div className="flex gap-2">
                  {[100, 250, 500].map(a => (
                    <button key={a} onClick={() => setWithdrawAmount(String(a))} disabled={a > balance}
                      className="flex-1 py-2 rounded-lg text-xs font-russo border border-[var(--card-border)] text-gray-400 hover:border-yellow-400 hover:text-yellow-400 transition-all disabled:opacity-30">
                      {a} ₽
                    </button>
                  ))}
                </div>
                <button onClick={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > balance || !withdrawCard || withdrawCard.length < 16}
                  className="w-full py-3 rounded-xl font-russo text-base tracking-wide transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)", color: "#0A0C14" }}>
                  ВЫВЕСТИ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DONATE ── */}
        {page === "donate" && (
          <div className="animate-fade-in space-y-4 max-w-lg mx-auto">
            <div className="card-dark p-5 text-center">
              <div className="text-5xl mb-3 animate-glow-pulse">💎</div>
              <h2 className="font-russo text-xl neon-text-purple mb-2">ПОДДЕРЖАТЬ ПРОЕКТ</h2>
              <p className="text-gray-400 text-sm mb-5">Помоги нам развиваться и получай особые привилегии!</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[50, 100, 200, 300, 500, 1000].map(a => (
                  <button key={a} onClick={() => setDonateAmount(a)} disabled={a > balance}
                    className={`py-2.5 rounded-xl text-sm font-russo transition-all border ${donateAmount === a
                      ? "border-purple-400 text-purple-400"
                      : "border-[var(--card-border)] text-gray-400 hover:border-purple-500"
                      } disabled:opacity-30`}
                    style={donateAmount === a ? { boxShadow: "0 0 8px rgba(168,85,247,0.4)" } : {}}>
                    {a} ₽
                  </button>
                ))}
              </div>
              <div className="p-3 rounded-xl mb-4 text-center border border-yellow-400/20"
                style={{ background: "rgba(255,215,0,0.05)" }}>
                <span className="text-xs text-gray-500">Баланс: </span>
                <span className="font-russo text-sm neon-text-gold">{formatCurrency(balance)}</span>
              </div>
              <button onClick={handleDonate} disabled={donateAmount > balance}
                className="w-full py-3 rounded-xl font-russo text-base tracking-wide transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #A855F7, #7C3AED)", color: "white" }}>
                💜 ЗАДОНАТИТЬ {formatCurrency(donateAmount)}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "⭐", label: "VIP статус", desc: "Особая метка" },
                { icon: "🚀", label: "Бонус ×1.5", desc: "На 24 часа" },
                { icon: "🎁", label: "+10% к донату", desc: "На баланс" },
              ].map(b => (
                <div key={b.label} className="card-dark p-3 text-center">
                  <div className="text-2xl mb-1">{b.icon}</div>
                  <div className="text-xs font-russo text-gray-300 mb-0.5">{b.label}</div>
                  <div className="text-xs text-gray-500">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {page === "history" && (
          <div className="animate-fade-in space-y-3 max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="History" size={18} className="text-yellow-400" />
              <h2 className="font-russo text-base text-white">ИСТОРИЯ ТРАНЗАКЦИЙ</h2>
              <span className="ml-auto text-xs text-gray-500">{transactions.length} записей</span>
            </div>
            {transactions.length === 0 ? (
              <div className="card-dark p-8 text-center text-gray-500">
                <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Пока нет операций</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="card-dark p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${tx.type === "win" ? "#00FF88" : tx.type === "loss" ? "#FF4444" : tx.type === "deposit" ? "#00BFFF" : tx.type === "donate" ? "#A855F7" : "#FFD700"}18` }}>
                      <Icon name={txIcons[tx.type]} size={15} className={txColors[tx.type]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-300 truncate">{tx.description}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {tx.date.toLocaleDateString("ru-RU")} {tx.date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className={`font-russo text-sm flex-shrink-0 ${txColors[tx.type]}`}>
                      {tx.type === "win" || tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE ── */}
        {page === "profile" && (
          <div className="animate-fade-in space-y-4 max-w-lg mx-auto">
            <div className="card-dark p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,191,255,0.06) 0%, transparent 70%)" }} />
              <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl border-2 border-sky-400/50"
                style={{ background: "rgba(0,191,255,0.08)" }}>
                👤
              </div>
              <h2 className="font-russo text-xl text-white mb-0.5">Игрок #1337</h2>
              <div className="text-xs text-gray-500 mb-3">Зарегистрирован: 05.05.2026</div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-russo border border-sky-400/30"
                style={{ background: "rgba(0,191,255,0.1)", color: "#00BFFF" }}>
                🔵 ОБЫЧНЫЙ ИГРОК
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Баланс", value: formatCurrency(balance), icon: "Wallet", color: "#FFD700" },
                { label: "Игр сыграно", value: transactions.filter(t => t.type === "win" || t.type === "loss").length, icon: "Gamepad2", color: "#00BFFF" },
                { label: "Побед", value: transactions.filter(t => t.type === "win").length, icon: "Trophy", color: "#00FF88" },
                { label: "Донатов", value: formatCurrency(transactions.filter(t => t.type === "donate").reduce((s, t) => s + t.amount, 0)), icon: "Heart", color: "#A855F7" },
              ].map(s => (
                <div key={s.label} className="card-dark p-4">
                  <Icon name={s.icon} size={18} style={{ color: s.color }} className="mb-2" />
                  <div className="font-russo text-lg" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="card-dark p-4 space-y-1">
              <div className="font-russo text-sm text-gray-400 mb-2">НАСТРОЙКИ</div>
              {[
                { label: "Изменить никнейм", icon: "Pencil" },
                { label: "Привязать карту", icon: "CreditCard" },
                { label: "Уведомления", icon: "Bell" },
                { label: "Выйти", icon: "LogOut" },
              ].map(item => (
                <button key={item.label}
                  className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl border border-transparent hover:border-[var(--card-border)] hover:bg-[#1a1f30] transition-all text-gray-400 hover:text-gray-200 text-sm">
                  <Icon name={item.icon} size={15} />
                  {item.label}
                  <Icon name="ChevronRight" size={13} className="ml-auto opacity-40" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ADMIN ── */}
        {page === "admin" && (
          <div className="animate-fade-in space-y-4 max-w-lg mx-auto">
            <div className="card-dark p-4 border border-red-500/30" style={{ boxShadow: "0 0 20px rgba(255,68,68,0.1)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Shield" size={18} className="text-red-400" />
                <h2 className="font-russo text-base text-red-400">АДМИН-ПАНЕЛЬ</h2>
              </div>
              <p className="text-xs text-gray-500">Полный доступ к управлению игрой</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Онлайн", value: "1", icon: "Users", color: "#00FF88" },
                { label: "Транзакций", value: transactions.length, icon: "BarChart2", color: "#00BFFF" },
                { label: "Оборот", value: formatCurrency(transactions.reduce((s, t) => s + t.amount, 0)), icon: "TrendingUp", color: "#FFD700" },
                { label: "Баланс сервера", value: "10 000 ₽", icon: "Server", color: "#A855F7" },
              ].map(s => (
                <div key={s.label} className="card-dark p-4">
                  <Icon name={s.icon} size={18} style={{ color: s.color }} className="mb-2" />
                  <div className="font-russo text-base" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="card-dark p-4 space-y-1">
              <div className="font-russo text-sm text-gray-400 mb-2">УПРАВЛЕНИЕ</div>
              {[
                { label: "Управление игроками", icon: "Users" },
                { label: "Настройки игры", icon: "Settings" },
                { label: "Выгрузка транзакций", icon: "Download" },
                { label: "Настройки мин (5 шт.)", icon: "Bomb" },
              ].map(item => (
                <button key={item.label}
                  className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl border border-transparent hover:border-[var(--card-border)] hover:bg-[#1a1f30] transition-all text-gray-400 hover:text-gray-200 text-sm">
                  <Icon name={item.icon} size={15} />
                  {item.label}
                  <Icon name="ChevronRight" size={13} className="ml-auto opacity-40" />
                </button>
              ))}
            </div>
            <div className="card-dark p-4">
              <div className="font-russo text-sm text-gray-400 mb-3">ПОСЛЕДНИЕ ТРАНЗАКЦИИ</div>
              <div className="space-y-2">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between text-xs py-1 border-b border-[var(--card-border)] last:border-0">
                    <span className="text-gray-400">{tx.description}</span>
                    <span className={txColors[tx.type]}>{formatCurrency(tx.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--card-border)]"
        style={{ background: "rgba(10,12,20,0.97)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-stretch">
          {navItems.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-all ${active ? "text-yellow-400" : "text-gray-600 hover:text-gray-400"}`}>
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ background: "#FFD700", boxShadow: "0 0 8px #FFD700" }} />
                )}
                <Icon name={item.icon} size={item.id === "miner" ? 20 : 17} />
                <span className="text-[8px] font-russo leading-tight">{item.label.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}