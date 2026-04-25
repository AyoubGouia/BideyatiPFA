import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Filler, Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

// ─── Design tokens (light mode) ───────────────────────────────────────────────
const C = {
  deepOrange: "#EB5A1C",
  darkBlue:   "#1F3A5F",
  medBlue:    "#3C6E8F",
  leafGreen:  "#6FBF4A",
  darkGreen:  "#3EBE3E",
  golden:     "#F2B233",
  orange:     "#F58A1F",
  medGray:    "#717171",
  surfaceBg:  "#F5F8FC",
  cardBg:     "#FFFFFF",
  border:     "#E8EFF8",
  borderLight:"#F0F4FA",
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StudentScore {
  studentId: string;
  totalScore: number;   // ex: 15.5
  baseScore?: number;
  hasRegionBonus?: boolean;
  subject: string;      // ex: "Sciences"
}

export interface FacultyAdmissionHistory {
  facultyId: string;
  facultyName: string;
  years: {
    year: number;
    minScore: number;
    admissionRate: number;   // taux historique de la fac, ex: 72
    totalApplicants?: number;
    admitted?: number;
  }[];
}

export interface AdmissionRateSectionProps {
  studentScore: StudentScore;
  facultyHistory: FacultyAdmissionHistory;
  currentYear: number;
}

// ─── Core calculation ─────────────────────────────────────────────────────────
/**
 * Calcule le taux d'admission personnalisé de l'étudiant
 * en fonction de son score et du taux historique de la fac.
 *
 * @param score        Score de l'étudiant  (ex: 15.5)
 * @param minScore     Seuil minimum de la fac pour cette année (ex: 14.8)
 * @param admissionRate Taux historique de la fac en %  (ex: 72)
 * @returns            Taux calculé arrondi à l'entier, entre 0 et 100
 */
export function calcAdmissionRate(
  score: number,
  minScore: number,
  admissionRate: number
): number {
  const delta = score - minScore;

  let baseChance: number;

  if (delta <= -20) {
    baseChance = 1;
  } else if (delta <= -10) {
    // Linear interpolation between -20 (1%) and -10 (20%)
    // (delta - (-20)) / (-10 - (-20)) = (delta + 20) / 10
    baseChance = 1 + ((delta + 20) / 10) * (20 - 1);
  } else if (delta <= 0) {
    // Linear interpolation between -10 (20%) and 0 (50%)
    baseChance = 20 + ((delta + 10) / 10) * (50 - 20);
  } else if (delta <= 10) {
    // Linear interpolation between 0 (50%) and 10 (95%)
    baseChance = 50 + (delta / 10) * (95 - 50);
  } else if (delta <= 20) {
    // Linear interpolation between 10 (95%) and 20 (99%)
    baseChance = 95 + ((delta - 10) / 10) * (99 - 95);
  } else {
    baseChance = 99;
  }

  return Math.min(100, Math.max(0, Math.round(baseChance)));
}

// ─── Status helpers ───────────────────────────────────────────────────────────
type Status = "high" | "medium" | "low" | "critical";

function getStatus(delta: number): Status {
  if (delta >= 2)  return "high";
  if (delta >= 0)  return "medium";
  if (delta >= -2) return "low";
  return "critical";
}

const STATUS_CFG: Record<Status, {
  label: string; color: string; bg: string; textColor: string;
}> = {
  high:     { label: "Très bonne chance",   color: C.leafGreen,  bg: "#F0FAE8", textColor: "#27500A" },
  medium:   { label: "Bonne chance",         color: C.golden,     bg: "#FFFBEF", textColor: "#633806" },
  low:      { label: "Chance limitée",       color: C.orange,     bg: "#FFF7EF", textColor: "#854F0B" },
  critical: { label: "Admission difficile",  color: C.deepOrange, bg: "#FFF1EC", textColor: "#A32D2D" },
};

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, valueColor,
}: {
  label: string; value: string; sub: string; valueColor?: string;
}) {
  return (
    <div
      style={{
        background: C.surfaceBg, borderRadius: 12,
        padding: "14px 16px", border: `1px solid ${C.border}`,
      }}
    >
      <div style={{
        fontSize: 10, color: C.medGray, fontWeight: 600,
        letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 700,
        color: valueColor ?? C.darkBlue, lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.medGray, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

// ─── Dual-axis chart ──────────────────────────────────────────────────────────
interface ChartProps {
  labels: string[];
  minScores: number[];
  historicRates: number[];
  calcRates: number[];
}

function DualAxisChart({ labels, minScores, historicRates, calcRates }: ChartProps) {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  const [tt, setTt] = useState<{
    visible: boolean; x: number; areaTop: number; areaBottom: number;
    year: string; minScore: number; historic: number; calc: number;
  }>({ visible: false, x: 0, areaTop: 0, areaBottom: 0, year: "", minScore: 0, historic: 0, calc: 0 });

  const data = {
    labels,
    datasets: [
      {
        label: "Score min.",
        data: minScores,
        borderColor: C.darkBlue,
        backgroundColor: "transparent",
        borderWidth: 2,
        pointBackgroundColor: "#fff",
        pointBorderColor: C.darkBlue,
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 6,
        tension: 0.1,
        yAxisID: "yLeft",
      },
      {
        label: "Taux historique %",
        data: historicRates,
        borderColor: C.darkGreen,
        backgroundColor: "transparent",
        borderWidth: 2.5,
        pointBackgroundColor: "#fff",
        pointBorderColor: C.darkGreen,
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 6,
        tension: 0.1,
        yAxisID: "yRight",
      },
      {
        label: "Votre taux calculé",
        data: calcRates,
        borderColor: C.deepOrange,
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [6, 4],
        pointBackgroundColor: C.deepOrange,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
        yAxisID: "yRight",
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: (ctx: any) => {
          const chart = ctx.chart;
          const ca = chart.chartArea;
          if (ctx.tooltip.opacity === 0) {
            setTt((p) => p.visible ? { ...p, visible: false } : p);
            return;
          }
          const idx = ctx.tooltip.dataPoints[0]?.dataIndex ?? 0;
          const pt = chart.getDatasetMeta(0).data[idx];
          
          setTt((prev) => {
            if (
              prev.visible === true &&
              prev.x === pt.x &&
              prev.year === labels[idx]
            ) {
              return prev;
            }
            return {
              visible: true,
              x: pt.x,
              areaTop: ca.top,
              areaBottom: ca.bottom,
              year: labels[idx],
              minScore: minScores[idx],
              historic: historicRates[idx],
              calc: calcRates[idx],
            };
          });
        },
      },
    },
    scales: {
      yLeft: {
        type: "linear", position: "left", min: 0, max: 20,
        grid: { color: C.borderLight },
        ticks: { color: "#aaa", font: { size: 10 }, stepSize: 4 },
        border: { display: false },
      },
      yRight: {
        type: "linear", position: "right", min: 0, max: 125,
        grid: { drawOnChartArea: false },
        ticks: { color: "#aaa", font: { size: 10 }, stepSize: 25, callback: (v: number) => v + "%" },
        border: { display: false },
      },
      x: {
        grid: { color: C.borderLight },
        ticks: { color: "#aaa", font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  return (
    <div style={{ position: "relative", width: "100%", height: 260 }}>
      <Line ref={chartRef} data={data as any} options={options} />

      {/* Crosshair */}
      {tt.visible && (
        <div
          style={{
            position: "absolute",
            left: tt.x, top: tt.areaTop,
            height: tt.areaBottom - tt.areaTop,
            width: 1, background: "#bbb", pointerEvents: "none",
          }}
        />
      )}

      {/* Custom tooltip */}
      {tt.visible && (
        <div
          style={{
            position: "absolute",
            left: tt.x + 14 > 180 ? tt.x - 200 : tt.x + 14,
            top: tt.areaTop + 20,
            background: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            pointerEvents: "none",
            minWidth: 185,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            fontFamily: "'Open Sans',sans-serif",
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700, color: C.darkBlue, marginBottom: 5, fontSize: 14 }}>
            {tt.year}
          </div>
          <div style={{ color: "#333", marginBottom: 2 }}>Score Min : {tt.minScore}</div>
          <div style={{ color: C.darkGreen, fontWeight: 600, marginBottom: 4 }}>
            Taux historique : {tt.historic}%
          </div>
          <div
            style={{
              color: C.deepOrange, fontSize: 11, fontWeight: 600,
              borderTop: `1px solid ${C.borderLight}`, paddingTop: 4,
            }}
          >
            Votre taux calculé : {tt.calc}%
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdmissionRatePage({
  studentScore,
  facultyHistory,
  currentYear,
}: AdmissionRateSectionProps) {
  const sorted  = [...facultyHistory.years].sort((a, b) => b.year - a.year);
  const latest  = sorted[0];
  const display = sorted.slice(0, 4).reverse(); // ordre chronologique pour le graphique

  const delta     = latest ? +(studentScore.totalScore - latest.minScore).toFixed(1) : 0;
  const status    = getStatus(delta);
  const cfg       = STATUS_CFG[status];

  // Taux calculé pour l'année courante
  const calcRateNow = latest
    ? calcAdmissionRate(studentScore.totalScore, latest.minScore, latest.admissionRate)
    : 0;

  // Séries pour le graphique
  const labels       = display.map((y) => String(y.year));
  const minScores    = display.map((y) => y.minScore);
  const historicRates = display.map((y) => y.admissionRate);
  const calcRates    = display.map((y) =>
    calcAdmissionRate(studentScore.totalScore, y.minScore, y.admissionRate)
  );

  const rateColor =
    calcRateNow >= 70 ? C.leafGreen :
    calcRateNow >= 40 ? C.golden :
    C.deepOrange;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap');
        .adm-root { background:#fff; font-family:'Open Sans',sans-serif; color:#333; padding:20px 0 40px; }
        .adm-root * { box-sizing:border-box; }
        .adm-metrics { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-bottom:18px; }
        @media(max-width:480px){ .adm-metrics { grid-template-columns:1fr; } }
      `}</style>

      <div className="adm-root">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <div style={{ width: 4, height: 26, borderRadius: 2, background: C.deepOrange, flexShrink: 0 }} />
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 19, fontWeight: 700, color: C.darkBlue, margin: 0 }}>
            Taux d'admission
          </h2>
        </div>
        <p style={{ fontSize: 12, color: C.medGray, paddingLeft: 14, marginBottom: 20 }}>
          {facultyHistory.facultyName} · Analyse personnalisée · {currentYear}
        </p>

        {/* Status card */}
        <div
          style={{
            background: C.cardBg, borderRadius: 16, border: `1.5px solid ${C.border}`,
            padding: "20px 24px", marginBottom: 18,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 16,
          }}
        >
          <div style={{ flex: "1 1 250px" }}>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                fontFamily: "'Poppins',sans-serif", marginBottom: 10,
                background: cfg.bg, color: cfg.textColor,
                border: `1.5px solid ${cfg.color}40`,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
              {cfg.label}
            </div>

            <p style={{ fontSize: 13, color: C.medGray, maxWidth: 320, lineHeight: 1.6, margin: "0 0 10px" }}>
              {delta >= 0
                ? "Votre score dépasse le seuil minimum. Le dossier complet sera déterminant."
                : "Votre score est en dessous du seuil. Envisagez des filières alternatives."}
            </p>

            {/* Delta chip */}
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: cfg.bg, border: `1px solid ${cfg.color}30`,
                borderRadius: 8, padding: "7px 12px",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>
                {delta > 0 ? "+" : ""}{delta}
              </span>
              <span style={{ fontSize: 11, color: cfg.textColor, fontWeight: 600 }}>
                point{Math.abs(delta) !== 1 ? "s" : ""}{" "}
                {delta >= 0 ? "au-dessus" : "en dessous"} du seuil min
              </span>
            </div>
          </div>

          {/* Score pill */}
          <div
            style={{
              background: C.surfaceBg, borderRadius: 12,
              padding: "10px 16px", textAlign: "right", border: `1px solid ${C.border}`,
            }}
          >
            <div style={{
              fontSize: 10, color: C.medGray, marginBottom: 3,
              fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              Votre score
            </div>
            <div style={{
              fontFamily: "'Poppins',sans-serif", fontSize: 26,
              fontWeight: 700, color: C.darkBlue, lineHeight: 1,
            }}>
              {studentScore.totalScore}
            </div>
            <div style={{ fontSize: 11, color: C.medBlue, marginTop: 3 }}>
              {studentScore.subject}
              {studentScore.hasRegionBonus && (
                <div style={{ color: C.leafGreen, fontWeight: 700, marginTop: 2, fontSize: 10 }}>
                  (+7% Bonus Régional)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2 metric cards only */}
        {latest && (
          <div className="adm-metrics">
            <MetricCard
              label="Taux d'admission calculé"
              value={`${calcRateNow}%`}
              sub="Basé sur l'évolution de la spécialité"
              valueColor={rateColor}
            />
            <MetricCard
              label={`Seuil minimum ${latest.year}`}
              value={String(latest.minScore)}
              sub="Score requis /20"
            />
          </div>
        )}

        {/* Dual-axis chart */}
        <div
          style={{
            background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`,
            padding: "20px 24px 16px", marginBottom: 14,
          }}
        >
          <div style={{
            fontFamily: "'Poppins',sans-serif", fontSize: 14,
            fontWeight: 700, color: C.darkBlue, marginBottom: 10,
          }}>
            Évolution des taux
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginBottom: 10, fontSize: 12, color: "#555", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, height: 2, background: C.darkBlue, display: "inline-block" }} />
              Score min.
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, height: 2, background: C.darkGreen, display: "inline-block" }} />
              Taux estimé fac
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, display: "inline-block", borderTop: `2px dashed ${C.deepOrange}` }} />
              Votre taux calculé
            </span>
          </div>

          <DualAxisChart
            labels={labels}
            minScores={minScores}
            historicRates={historicRates}
            calcRates={calcRates}
          />
        </div>

        {/* Disclaimer */}
        <div
          style={{
            background: C.surfaceBg, borderRadius: 10, border: `1px solid ${C.border}`,
            padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 14, height: 14, borderRadius: "50%", background: C.medBlue,
              color: "#fff", fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 1,
            }}
          >i</div>
          <p style={{ fontSize: 11, color: C.medGray, lineHeight: 1.6, margin: 0 }}>
            Ce calcul est une estimation mathématique non officielle servant d'indicateur, basée sur l'évolution historique des seuils de la faculté.
          </p>
        </div>
      </div>
    </>
  );
}
