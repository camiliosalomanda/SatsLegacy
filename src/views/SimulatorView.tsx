import React, { useState } from 'react';
import { usePrice } from '../contexts/PriceContext';
import { useUI } from '../contexts/UIContext';

interface Projection {
  scenario: string;
  data: { year: number; btc: number; usd: number }[];
  finalUSD: number;
}

export function SimulatorView() {
  const { btcPrice } = usePrice();
  const { simulatorData, setSimulatorData } = useUI();
  const [projections, setProjections] = useState<Projection[] | null>(null);

  const calculateProjections = () => {
    const scenarios = ['conservative', 'moderate', 'optimistic'] as const;
    const growthRates = { conservative: 0.15, moderate: 0.25, optimistic: 0.40 };

    const results = scenarios.map(scenario => {
      let value = simulatorData.btcAmount;
      const yearlyData = [];

      for (let year = 0; year <= simulatorData.years; year++) {
        yearlyData.push({
          year: 2024 + year,
          btc: value,
          usd: value * btcPrice * Math.pow(1 + growthRates[scenario], year)
        });
      }

      return {
        scenario,
        data: yearlyData,
        finalUSD: yearlyData[yearlyData.length - 1].usd
      };
    });

    setProjections(results);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Legacy Simulator</h2>
        <p className="text-zinc-500">Project your Bitcoin inheritance across generations</p>
      </div>

      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm text-zinc-500 mb-2">BTC Amount</label>
            <input
              type="number"
              value={simulatorData.btcAmount}
              onChange={(e) => setSimulatorData({ ...simulatorData, btcAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-2">Time Horizon (years)</label>
            <input
              type="number"
              value={simulatorData.years}
              onChange={(e) => setSimulatorData({ ...simulatorData, years: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-2">Generations</label>
            <input
              type="number"
              value={simulatorData.generations}
              onChange={(e) => setSimulatorData({ ...simulatorData, generations: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-2">Heirs per Generation</label>
            <input
              type="number"
              value={simulatorData.heirs}
              onChange={(e) => setSimulatorData({ ...simulatorData, heirs: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
        <button
          onClick={calculateProjections}
          className="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Calculate Projections
        </button>
      </div>

      {projections && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projections.map(proj => (
            <div key={proj.scenario} className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white capitalize mb-2">{proj.scenario}</h3>
              <p className="text-3xl font-bold text-orange-400">${(proj.finalUSD / 1000000).toFixed(1)}M</p>
              <p className="text-sm text-zinc-500 mt-1">After {simulatorData.years} years</p>
              <p className="text-xs text-zinc-600 mt-2">
                ${(proj.finalUSD / Math.pow(simulatorData.heirs, simulatorData.generations) / 1000000).toFixed(2)}M per heir
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
