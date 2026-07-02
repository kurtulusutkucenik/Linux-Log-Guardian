"use client";

import { Fragment } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

export default function VsTable() {
  const { locale } = useI18n();
  const VS = getCopy(locale).vs;

  return (
    <section
      id="rakipler"
      className="border-y border-neutral-900 bg-panel/40 py-24"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
            {VS.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-5xl">
            {VS.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-neutral-400">
            {VS.sub}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <h3 className="text-center font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            {VS.advTitle}
          </h3>
          <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-relaxed text-neutral-400">
            {VS.advLead}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VS.advantages.map((a) => (
              <div
                key={a.k}
                className="min-w-0 rounded-xl border border-neon/20 bg-gradient-to-b from-neon/[0.05] to-transparent p-5"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 font-bold text-neon">✓</span>
                  <p className="font-display text-base font-bold text-white">{a.k}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{a.v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 overflow-hidden rounded-xl border border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-800 bg-panel">
                  {VS.cols.map((col, i) => (
                    <th
                      key={col}
                      className={`px-5 py-4 font-mono text-xs uppercase tracking-wider ${
                        i === 1 ? "text-white" : "text-neutral-400"
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VS.groups.map((group) => (
                  <Fragment key={group.label}>
                    <tr className="bg-black/40">
                      <td
                        colSpan={VS.cols.length}
                        className="px-5 py-2.5 font-mono text-[11px] uppercase tracking-wider text-neutral-500"
                      >
                        {group.label}
                      </td>
                    </tr>
                    {group.rows.map((row, ri) => {
                      const winner = group.winners[ri] ?? 0;
                      return (
                        <tr
                          key={group.label + ri}
                          className="border-b border-neutral-900 transition-colors hover:bg-panel-alt"
                        >
                          {row.map((cell, ci) => {
                            const isWinner = ci === winner && winner > 0;
                            const dim = cell === "—";
                            let cls = "text-neutral-400";
                            if (ci === 0) cls = "text-neutral-300 font-mono";
                            else if (isWinner) cls = "text-neon font-semibold";
                            else if (dim) cls = "text-neutral-700";
                            return (
                              <td
                                key={ci}
                                className={`px-5 py-3 text-xs ${
                                  ci === 0 ? "" : "font-mono"
                                } ${isWinner ? "bg-neon/[0.07]" : ""} ${cls}`}
                              >
                                {cell}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-4xl items-center justify-center gap-2 text-[11px] text-neutral-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-neon" />
          {VS.legend}
        </div>

        <p className="mx-auto mt-6 max-w-4xl rounded-lg border border-neutral-800 bg-black/40 p-5 text-sm leading-relaxed text-neutral-400">
          {VS.note}
        </p>
      </div>
    </section>
  );
}
