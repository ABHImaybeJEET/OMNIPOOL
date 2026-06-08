import React, { useEffect, useState } from "react";
import {
  getLeaderboard,
  getMyRank,
  type LeaderboardEntry,
  type LeaderboardPeriod,
  type LeaderboardScope,
} from "../api/client";

const LeaderboardPage: React.FC = () => {
  const [scope, setScope] = useState<LeaderboardScope>("all");
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Leaderboard
        </h1>
        <p className="text-text-secondary mb-6">
          Ranking based on completed equipment contributions.
        </p>

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
