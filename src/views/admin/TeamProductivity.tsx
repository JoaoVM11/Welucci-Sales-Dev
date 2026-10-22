import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, Users, Calendar, ArrowUpRight } from 'lucide-react';
import { store } from '../../services/store';

export const TeamProductivity: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = store.subscribe(() => setTick(t => t + 1));
    return () => unsub();
  }, []);

  const teamKpi = store.getTeamKpiSummary();
  const sdrs = store.getSdrUsers();
  const summaries = sdrs.map(s => store.getSdrKpiSummary(s.id));
  const selectedDate = store.getSelectedDate();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#d1d5d6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 sm:p-2.5 rounded-lg bg-[#14262d] text-[#d1d5d6] shrink-0">
              <Clock className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#14262d] tracking-tight">
                  Capacidade Produtiva & Carga da Equipe
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#14262d] border border-[#d1d5d6]">
                  {selectedDate}
                </span>
              </div>
              <p className="text-xs text-[#6a797c] mt-0.5">
                Cálculo em tempo real da carga operacional necessária versus o tempo líquido disponível no expediente das 09h às 19h.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#6a797c] bg-[#f8fafb] px-3 py-2 rounded-lg border border-[#d1d5d6] w-fit">
          <Calendar className="w-3.5 h-3.5 text-[#14262d]" />
          <span>Margem de segurança configurada: <strong className="text-[#14262d]">10%</strong></span>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Carga Total Estimada</span>
          <p className="text-2xl font-bold font-mono text-[#14262d] mt-2">{teamKpi.totalWorkloadMinutes} min</p>
          <p className="text-[11px] text-[#6a797c] mt-1">~{(teamKpi.totalWorkloadMinutes / 60).toFixed(1)} horas de execução</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Capacidade Líquida</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-2">{teamKpi.totalCapacityMinutes} min</p>
          <p className="text-[11px] text-[#6a797c] mt-1">Descontados reuniões e pausas</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">Utilização Média</span>
          <p className="text-2xl font-bold font-mono text-[#14262d] mt-2">{teamKpi.averageCapacityUtilization}%</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Capacidade balanceada</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d1d5d6]/70 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-[#6a797c] tracking-wider">SDRs em Sobrecarga</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-2">{teamKpi.sdrsAtOperationalRiskCount}</p>
          <p className="text-[11px] text-[#6a797c] mt-1">Requer apoio ou reescalonamento</p>
        </div>
      </div>

      {/* Visual Bar Comparison: Workload vs Available Capacity per SDR */}
      <div className="bg-white rounded-xl border border-[#d1d5d6]/70 p-4 sm:p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#14262d] uppercase tracking-wide">
            Comparativo Individual: Carga de Trabalho vs Capacidade Disponível
          </h3>
          <p className="text-xs text-[#6a797c] mt-0.5">
            Identifique quem possui capacidade ociosa para receber novos leads e quem está próximo do limite operacional.
          </p>
        </div>

        <div className="space-y-5">
          {summaries.map((sdr) => {
            const isOverloaded = sdr.capacityUtilizationPercent > 100;
            return (
              <div key={sdr.sdrId} className="space-y-2 p-3 bg-[#f8fafb]/60 rounded-lg border border-[#d1d5d6]/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#14262d]">{sdr.sdrName}</span>
                    <span className="text-[11px] text-[#6a797c]">({sdr.scope})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-[11px]">
                    <span>Carga: <strong className="text-[#14262d]">{sdr.workloadMinutes} min</strong></span>
                    <span>·</span>
                    <span>Capacidade: <strong className="text-[#14262d]">{sdr.availableCapacityMinutes} min</strong></span>
                    <span>·</span>
                    <span className={`font-bold ${
                      isOverloaded ? 'text-rose-600' : sdr.capacityUtilizationPercent > 80 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {sdr.capacityUtilizationPercent}% ({sdr.capacityStatus})
                    </span>
                  </div>
                </div>

                {/* Dual Visual Bar */}
                <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden flex border border-[#d1d5d6]/60">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isOverloaded ? 'bg-rose-500' : sdr.capacityUtilizationPercent > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, sdr.capacityUtilizationPercent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
