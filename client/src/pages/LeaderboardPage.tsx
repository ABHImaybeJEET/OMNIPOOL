import React, { useEffect, useState } from "react";
import {
  getLeaderboard,
  getMyRank,
  type LeaderboardEntry,
  type LeaderboardPeriod,
  type LeaderboardScope,
} from "../api/client";
import { HelpCircle, ChevronDown, ChevronUp, Info, Sparkles, Trophy } from "lucide-react";

const LeaderboardPage: React.FC = () => {
  const [scope, setScope] = useState<LeaderboardScope>("all");
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [leaderboardRes, rankRes] = await Promise.allSettled([
          getLeaderboard({ scope, period, limit: 50 }),
          getMyRank({ scope, period }),
        ]);

        if (leaderboardRes.status === "fulfilled") {
          setEntries(leaderboardRes.value.data?.data || []);
        } else {
          console.error("Failed to load leaderboard", leaderboardRes.reason);
          setEntries([]);
        }

        if (rankRes.status === "fulfilled") {
          setMyRank(rankRes.value.data?.data?.rank ?? null);
        } else {
          setMyRank(null);
        }
      } catch (error) {
        console.error("Failed to load leaderboard", error);
        setEntries([]);
        setMyRank(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [scope, period]);

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-accent-amber" />
              Leaderboard
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">
              Ranking based on completed equipment contributions.
            </p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-border-default bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-accent-indigo" />
            How points work
            {showHelp ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>

        {/* Collapsible Info Panel */}
        {showHelp && (
          <div className="bg-gradient-to-br from-accent-indigo/5 via-accent-violet/5 to-transparent border border-border-default rounded-2xl p-6 mb-8 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent-indigo/5 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-accent-indigo" />
              Points Calculation Guide
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rule 1 */}
              <div className="bg-bg-secondary/60 backdrop-blur-xs border border-border-default/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-accent-indigo/10 flex items-center justify-center text-accent-indigo font-bold text-xs">1</div>
                  <h4 className="text-sm font-bold text-text-primary">Base Points</h4>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Earn a flat <span className="font-semibold text-text-primary">10 points</span> base award for every successfully completed donation request.
                </p>
              </div>

              {/* Rule 2 */}
              <div className="bg-bg-secondary/60 backdrop-blur-xs border border-border-default/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-accent-indigo/10 flex items-center justify-center text-accent-indigo font-bold text-xs">2</div>
                  <h4 className="text-sm font-bold text-text-primary">Category Weights</h4>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-2">
                  Points scale dynamically based on complexity of equipment:
                </p>
                <div className="space-y-1 text-[11px] bg-bg-primary/40 p-2 rounded-lg">
                  <div className="flex justify-between text-text-secondary"><span className="text-text-muted">Development Boards / ICs</span><span className="font-semibold text-text-primary">3 pts / unit</span></div>
                  <div className="flex justify-between text-text-secondary"><span className="text-text-muted">Sensors / Tools / Power</span><span className="font-semibold text-text-primary">2 pts / unit</span></div>
                  <div className="flex justify-between text-text-secondary"><span className="text-text-muted">Cables / Passives</span><span className="font-semibold text-text-primary">1 pt / unit</span></div>
                </div>
              </div>

              {/* Rule 3 */}
              <div className="bg-bg-secondary/60 backdrop-blur-xs border border-border-default/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-accent-indigo/10 flex items-center justify-center text-accent-indigo font-bold text-xs">3</div>
                  <h4 className="text-sm font-bold text-text-primary">Condition Multipliers</h4>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-2">
                  Final points are adjusted depending on item wear:
                </p>
                <div className="space-y-1 text-[11px] bg-bg-primary/40 p-2 rounded-lg">
                  <div className="flex justify-between text-text-secondary"><span className="text-text-muted">New Condition</span><span className="font-semibold text-text-primary">1.0x multiplier</span></div>
                  <div className="flex justify-between text-text-secondary"><span className="text-text-muted">Refurbished Condition</span><span className="font-semibold text-text-primary">0.85x multiplier</span></div>
                  <div className="flex justify-between text-text-secondary"><span className="text-text-muted">Used Condition</span><span className="font-semibold text-text-primary">0.7x multiplier</span></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border-default/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-accent-indigo" />
                Formula: Points = (10 + Qty × Weight) × Condition Multiplier
              </span>
              <span className="font-medium text-text-secondary bg-bg-tertiary px-2.5 py-1 rounded-lg">
                Credited upon double-confirmation of handoff
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as LeaderboardScope)}
            className="px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary"
          >
            <option value="all">All</option>
            <option value="community">Individuals</option>
            <option value="enterprise">Enterprises</option>
          </select>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as LeaderboardPeriod)}
            className="px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary"
          >
            <option value="all">All time</option>
            <option value="monthly">This month</option>
          </select>

          <div className="ml-auto px-3 py-2 rounded-lg bg-bg-secondary border border-border-default text-sm text-text-secondary">
            Your rank: {myRank ?? "-"}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-default bg-bg-secondary">
          <table className="w-full text-sm">
            <thead className="bg-bg-tertiary text-text-secondary">
              <tr>
                <th className="text-left p-3">Rank</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Points</th>
                <th className="text-left p-3">Units Donated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-text-muted" colSpan={5}>
                    Loading leaderboard...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td className="p-4 text-text-muted" colSpan={5}>
                    No entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.user_id}
                    className="border-t border-border-default"
                  >
                    <td className="p-3 text-text-primary">#{entry.rank}</td>
                    <td className="p-3 text-text-primary">
                      {entry.account_type === "enterprise" && entry.company_name
                        ? entry.company_name
                        : entry.name}
                    </td>
                    <td className="p-3 text-text-secondary capitalize">
                      {entry.account_type}
                    </td>
                    <td className="p-3 text-text-primary">
                      {period === "monthly"
                        ? entry.points_monthly
                        : entry.points_total}
                    </td>
                    <td className="p-3 text-text-secondary">
                      {entry.donated_units_count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
