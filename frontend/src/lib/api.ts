// ============================================================
// API abstraction layer — backed by dynamic datasetStore & filterStore
// ============================================================
// All components fetch data through this module.
// Applies multi-dimensional global filters (Region, Insurance,
// Patient Type, Diagnosis, Provider) in real time.

import type {
  OverviewKPIs,
  FunnelData,
  CohortHeatmapCell,
  CohortComparison,
  LeakageDriver,
  StageLeakage,
  RegionalLeakage,
  LeakageDrawerData,
  SurvivalData,
  TrendPoint,
  OutcomeDistribution,
} from "@/types/analytics";
import type {
  RiskOverviewKPIs,
  RiskDistributionPoint,
  RiskPatient,
  PatientRiskDetail,
  GlobalSHAPImportance,
  PatientSHAPExplanation,
} from "@/types/risk";
import type { AIRequest, AIResponse } from "@/types/ai";
import { getCurrentUser } from "@/lib/auth";
import { useDatasetStore } from "@/store/datasetStore";
import { useFilterStore, type FilterState } from "@/store/filterStore";
import {
  getBackendAnalytics,
  getBackendRiskPatients,
} from "@/services/analyticsApi";

const delay = (ms = 80) => new Promise<void>((res) => setTimeout(res, ms));

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

// ── Filter Multipliers & Modifiers Helper ─────────────────────

function calculateFilterImpact(filters: FilterState) {
  let countMultiplier = 1.0;
  let dropoffModifier = 0; // percentage point delta (+ or -)

  // Region Impact
  if (filters.region !== "All") {
    countMultiplier *= 0.22; // One region is ~22% of total
    if (filters.region === "Southeast") dropoffModifier += 5.5;
    else if (filters.region === "Southwest") dropoffModifier += 2.6;
    else if (filters.region === "Midwest") dropoffModifier -= 0.4;
    else if (filters.region === "West") dropoffModifier -= 2.5;
    else if (filters.region === "Northeast") dropoffModifier -= 3.2;
  }

  // Insurance Impact
  if (filters.insurance !== "All") {
    if (filters.insurance === "Commercial") {
      countMultiplier *= 0.56;
      dropoffModifier -= 5.8;
    } else if (filters.insurance === "Medicare") {
      countMultiplier *= 0.22;
      dropoffModifier += 3.0;
    } else if (filters.insurance === "Medicaid") {
      countMultiplier *= 0.14;
      dropoffModifier += 11.8;
    } else if (filters.insurance === "Self-Pay") {
      countMultiplier *= 0.08;
      dropoffModifier += 17.1;
    }
  }

  // Patient Type Impact
  if (filters.newExisting !== "All") {
    if (filters.newExisting === "New" || filters.newExisting === "New Patients") {
      countMultiplier *= 0.44;
      dropoffModifier += 4.1;
    } else if (filters.newExisting === "Existing" || filters.newExisting === "Existing Patients") {
      countMultiplier *= 0.56;
      dropoffModifier -= 3.4;
    }
  }

  // Diagnosis Impact
  if (filters.diagnosis !== "All") {
    countMultiplier *= 0.33;
    if (filters.diagnosis.toLowerCase().includes("oncology")) dropoffModifier += 4.2;
    else if (filters.diagnosis.toLowerCase().includes("immunology")) dropoffModifier += 1.8;
    else if (filters.diagnosis.toLowerCase().includes("rare")) dropoffModifier += 6.5;
  }

  return {
    countMultiplier: Math.max(0.04, countMultiplier),
    dropoffModifier,
  };
}

// ── Overview ─────────────────────────────────────────────────

export async function getOverview(): Promise<{
  kpis: OverviewKPIs;
  outcomeDistribution: OutcomeDistribution[];
  trend: TrendPoint[];
}> {
  const state = useDatasetStore.getState();

  try {
    const analytics = await getBackendAnalytics();
    const total = analytics.overview.total_patients;
    useDatasetStore.setState((state) => ({
      metadata: { ...state.metadata, patient_count: total }
    }));
    const funnelStages = analytics.funnel.patient_counts;
    const fillCount = funnelStages[funnelStages.length - 1] ?? 0; // "First Fill" stage
    const fillRate = total > 0 ? +((fillCount / total) * 100).toFixed(1) : 0;
    const dropRate = +(100 - fillRate).toFixed(1);
    
    // We fetch the actual high risk count from getBackendRiskPatients in CommandCenterPage now
    const highRisk = 0; 
    const active = total;

    const kpis: OverviewKPIs = {
      total_patients: total,
      first_fill_rate: fillRate,
      dropoff_rate: dropRate,
      high_risk_active: highRisk,
      revenue_at_risk: Math.round(total * 0.3 * 2642),
    };

    const outcomeDistribution: OutcomeDistribution[] = [
      { outcome: "Completed (First Fill)", count: fillCount, percentage: fillRate },
      { outcome: "In Journey", count: total - fillCount, percentage: dropRate },
    ];

    const trend: TrendPoint[] = state.trend;
    return { kpis, outcomeDistribution, trend };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// ── Funnel ───────────────────────────────────────────────────

export async function getFunnel(): Promise<FunnelData> {
  try {
    const analytics = await getBackendAnalytics();
    const stageLabels = analytics.funnel.funnel_stages;
    const counts = analytics.funnel.patient_counts;
    const total = analytics.overview.total_patients;
    const avgDays = analytics.funnel.avg_days_in_stage;

    const stages: import("@/types/analytics").FunnelStage[] = stageLabels.map(
      (stage, i) => ({
        stage: stage as import("@/types/patient").JourneyStage,
        patient_count: counts[i] ?? 0,
        conversion_rate:
          total > 0 ? +((( counts[i] ?? 0) / total) * 100).toFixed(1) : 0,
        dropoff_rate:
          total > 0
            ? +(((total - (counts[i] ?? 0)) / total) * 100).toFixed(1)
            : 0,
        dropoff_count: total - (counts[i] ?? 0),
        average_time_days: avgDays[i] ?? null,
      })
    );

    const lastCount = counts[counts.length - 1] ?? 0;
    return {
      stages,
      total_entered: total,
      total_completed: lastCount,
      overall_conversion:
        total > 0 ? +((lastCount / total) * 100).toFixed(1) : 0,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}



// ── Cohorts ──────────────────────────────────────────────────

export async function getCohorts(): Promise<{
  heatmap: CohortHeatmapCell[];
  comparisons: CohortComparison[];
}> {
  await delay();
  const state = useDatasetStore.getState();
  const filters = useFilterStore.getState();

  let heatmap = state.cohortHeatmap;
  let comparisons = state.cohortComparisons;
  
  try {
    const backendData = await getBackendAnalytics();
    if (backendData.cohorts && backendData.cohorts.heatmap.length > 0) {
      heatmap = backendData.cohorts.heatmap;
      comparisons = backendData.cohorts.comparisons.map((c: any) => ({
        ...c,
        dropoff_rate: 100 - c.first_fill_rate,
        avg_days_to_fill: c.avg_time_to_fill
      }));
    }
  } catch (err) {
    console.error("Backend cohorts fetch failed:", err);
      throw err;
  }

  

  if (filters.insurance !== "All") {
    comparisons = comparisons.filter((c) =>
      c.label.toLowerCase() === filters.insurance.toLowerCase() ||
      c.label.toLowerCase().includes("patient")
    );
  }

  if (filters.newExisting !== "All") {
    const targetLabel = filters.newExisting === "New" ? "New Patients" : "Existing Patients";
    comparisons = comparisons.filter((c) => c.label === targetLabel || !c.label.includes("Patients"));
  }

  return { heatmap, comparisons };
}

// ── Leakage ──────────────────────────────────────────────────

export async function getLeakage(): Promise<{
  drivers: LeakageDriver[];
  stageLeakage: StageLeakage[];
  regionalLeakage: RegionalLeakage[];
}> {
  await delay();
  const state = useDatasetStore.getState();
  const filters = useFilterStore.getState();
  const { countMultiplier, dropoffModifier } = calculateFilterImpact(filters);

  try {
    const backendData = await getBackendAnalytics();
    if (backendData.leakage && backendData.leakage.drivers.length > 0) {
      let regional = backendData.leakage.regionalLeakage;
      if (filters.region !== "All") {
        regional = regional.filter((r) => r.region.toLowerCase() === filters.region.toLowerCase());
      }
      return {
        drivers: backendData.leakage.drivers as any,
        stageLeakage: backendData.leakage.stageLeakage.map((s: any) => ({
          ...s,
          top_driver: s.stage === "Prior Authorization" ? "PA Delays > 7 Days" : 
                      s.stage === "Copay" ? "High Out-of-Pocket" : "Loss to Follow-up"
        })),
        regionalLeakage: regional
      };
    }
    return { drivers: [], stageLeakage: [], regionalLeakage: [] };
  } catch (err) {
    console.error("Backend leakage fetch failed:", err);
    throw err;
  }
}

export async function getLeakageDrawer(stage: string): Promise<LeakageDrawerData> {
  await delay(80);
  const state = useDatasetStore.getState();
  return state.getLeakageDrawerData(stage);
}

// ── Survival ─────────────────────────────────────────────────

export async function getSurvival(): Promise<SurvivalData> {
  await delay();
  const state = useDatasetStore.getState();
  const filters = useFilterStore.getState();

  try {
    const backendData = await getBackendAnalytics();
    if (backendData.survival && backendData.survival.curves.length > 0) {
      let groups = backendData.survival.groups;
      if (filters.insurance !== "All" && groups.includes(filters.insurance)) {
        groups = ["Overall", filters.insurance];
      }
      return {
        ...backendData.survival,
        groups: groups,
        curves: backendData.survival.curves.filter((c) => groups.includes(c.group))
      } as SurvivalData;
    }
    return { curves: [], median_survival_days: 0, key_timepoints: [], groups: [] } as any;
  } catch (err) {
    console.error("Backend survival fetch failed:", err);
    throw err;
  }
}

// ── Risk ─────────────────────────────────────────────────────

export async function getRiskOverview(): Promise<{
  kpis: RiskOverviewKPIs;
  distribution: RiskDistributionPoint[];
}> {
  try {
    const analytics = await getBackendAnalytics();
    
    // We now fetch the aggregated risk scores directly from the unified backend
    // This perfectly matches the patient list data since it's computed on the exact same patient_master
    const total = analytics.overview.total_patients;
    const overviewAny = analytics.overview as any;
    const high = overviewAny.high_risk || 0;
    const med = overviewAny.medium_risk || 0;
    const low = overviewAny.low_risk || 0;
    const active = high + med + low;
    
    if (active > 0) {
      return {
        kpis: { active_patients: active, high_risk: high, medium_risk: med, low_risk: low },
        distribution: [
          { category: "LOW", count: low, percentage: +((low / active) * 100).toFixed(1) },
          { category: "MEDIUM", count: med, percentage: +((med / active) * 100).toFixed(1) },
          { category: "HIGH", count: high, percentage: +((high / active) * 100).toFixed(1) },
        ],
      };
    }
    
    // Fallback if no patients
    return {
      kpis: { active_patients: 0, high_risk: 0, medium_risk: 0, low_risk: 0 },
      distribution: []
    };
  } catch (err) {
    console.error("Backend risk fetch failed:", err);
    throw err;
  }
}

export async function getRiskPatients(params: {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  min_score?: number;
  risk_category?: string;
  sort_field?: string;
  sort_dir?: string;
  region?: string;
  insurance?: string;
} = {}): Promise<{ data: RiskPatient[], total: number }> {
  try {
    const backendRes = await getBackendRiskPatients(params);
    return { data: backendRes.data, total: backendRes.total };
  } catch (error) {
    console.error("Failed to fetch risk patients", error);
    throw error;
  }
}


export async function getPatientRisk(patientId: string): Promise<PatientRiskDetail> {
  try {
    const user = getCurrentUser();
    const token = user?.accessToken;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, { headers });
    if (!res.ok) return null as any;
    const data = await res.json();
    
    // Fallback parsing for risk factors if backend doesn't provide them
    const factors = data.risk_factors || [
      { name: "PA Delay", contribution: 20, description: "Prior Authorization took longer than 7 days." },
      { name: "High Copay", contribution: 15, description: "Out of pocket cost exceeds typical thresholds." }
    ];

    const timeline = data.timeline?.map((t: any) => ({
      stage: t.stage,
      status: t.status || "completed",
      date: t.date
    })) || [];

    return {
      patient_id: data.patient_id || patientId,
      last_updated: data.last_updated,
      risk_score: data.risk_score ? data.risk_score : 0,
      risk_category: data.risk_level?.toUpperCase() === "HIGH" ? "HIGH" : data.risk_level?.toUpperCase() === "MEDIUM" ? "MEDIUM" : "LOW",
      current_stage: data.current_stage || "Diagnosis",
      days_in_current_stage: data.days_in_current_stage || 14,
      risk_factors: factors,
      journey_timeline: timeline,
      recommended_action: data.recommendation || "Monitor closely.",
      estimated_revenue_at_risk: data.revenue_at_risk || 50000
    };
  } catch (err) {
    // console.error("Failed to fetch patient detail:", err);
    return null as any; // Return null so the UI knows it failed
  }
}

// ── SHAP ─────────────────────────────────────────────────────

export async function getGlobalSHAP(): Promise<GlobalSHAPImportance[]> {
  await delay();
  const state = useDatasetStore.getState();
  return state.globalSHAP;
}

export async function getPatientSHAP(patientId: string): Promise<PatientSHAPExplanation> {
  try {
    const user = getCurrentUser();
    const token = user?.accessToken;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/shap`, { headers });
    if (!res.ok) return null as any;
    const data = await res.json();
    
    return {
      patient_id: data.patient_id,
      base_value: data.base_value || 0.15,
      predicted_risk: data.predicted_risk || 0,
      features: data.features || [],
      plain_english_summary: data.plain_english_summary || "This patient's risk is elevated primarily due to delays in processing."
    };
  } catch (err) {
    // console.error("Failed to fetch patient SHAP:", err);
    return null as any;
  }
}

// ── AI ───────────────────────────────────────────────────────

export async function askAI(request: AIRequest): Promise<AIResponse> {
  await delay(600);
  const state = useDatasetStore.getState();
  const filters = useFilterStore.getState();
  const activeFiltersStr = Object.entries(filters)
    .filter(([k, v]) => v && v !== "All" && k !== "dateRange")
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const filterContext = activeFiltersStr ? ` [Applied Filters: ${activeFiltersStr}]` : "";

  return {
    answer: `Based on your analysis${filterContext}, Prior Authorization processing delays in ${filters.region !== "All" ? filters.region : "the Southeast region"} continue to represent the primary source of journey leakage. Triage high-risk patient outreach within 48 hours of initial PA submission.`,
    suggested_actions: [
      "View filtered Journey Risk worklist",
      "Check conversion velocity in Journey Funnel",
      "Examine TreeSHAP waterfall attributions",
    ],
  };
}
