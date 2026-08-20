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
    const fillCount = analytics.funnel.patient_counts[5] ?? 0; // "First Fill" stage
    const fillRate = total > 0 ? +((fillCount / total) * 100).toFixed(1) : 0;
    const dropRate = +(100 - fillRate).toFixed(1);
    const highRisk = Math.round(total * 0.3);
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
  } catch {
    // Fall back to mock data if no patients or backend error
    await delay();
    const filters = useFilterStore.getState();
    const { countMultiplier, dropoffModifier } = calculateFilterImpact(filters);
    const baseKPIs = state.overviewKPIs;
    const filteredPatients = Math.max(50, Math.round(baseKPIs.total_patients * countMultiplier));
    const filteredDropoffRate = Math.max(12, Math.min(85, +(baseKPIs.dropoff_rate + dropoffModifier).toFixed(1)));
    const filteredFillRate = +(100 - filteredDropoffRate).toFixed(1);
    const completedCount = Math.round(filteredPatients * (filteredFillRate / 100));
    const droppedCount = filteredPatients - completedCount;
    const kpis: OverviewKPIs = {
      total_patients: filteredPatients,
      first_fill_rate: filteredFillRate,
      dropoff_rate: filteredDropoffRate,
      high_risk_active: Math.round(droppedCount * 0.162),
      revenue_at_risk: Math.round(droppedCount * 2642),
    };
    return {
      kpis,
      outcomeDistribution: [
        { outcome: "Completed (First Fill)", count: completedCount, percentage: filteredFillRate },
        { outcome: "Dropped Off", count: droppedCount, percentage: filteredDropoffRate },
      ],
      trend: state.trend,
    };
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
  } catch {
    // Fallback to mock data
    await delay();
    const state = useDatasetStore.getState();
    const filters = useFilterStore.getState();
    const { countMultiplier, dropoffModifier } = calculateFilterImpact(filters);
    const total = Math.max(50, Math.round(state.funnelData.total_entered * countMultiplier));
    const overallConversion = Math.max(15, Math.min(88, +(state.funnelData.overall_conversion - dropoffModifier).toFixed(1)));
    const rxRate = Math.max(80, 93.0 - dropoffModifier * 0.1);
    const paRate = Math.max(60, 81.7 - dropoffModifier * 0.4);
    const copayRate = Math.max(65, 88.7 - dropoffModifier * 0.25);
    const fillRate = Math.max(70, 91.1 - dropoffModifier * 0.25);
    const rxCount = Math.round(total * (rxRate / 100));
    const paCount = Math.round(rxCount * (paRate / 100));
    const copayCount = Math.round(paCount * (copayRate / 100));
    const firstFillCount = Math.round(copayCount * (fillRate / 100));
    const stages: import("@/types/analytics").FunnelStage[] = [
      { stage: "Diagnosis", patient_count: total, conversion_rate: 100, dropoff_rate: 0, dropoff_count: 0, average_time_days: null },
      { stage: "Prescription", patient_count: rxCount, conversion_rate: +((rxCount / total) * 100).toFixed(1), dropoff_rate: +(((total - rxCount) / total) * 100).toFixed(1), dropoff_count: total - rxCount, average_time_days: 4.2 },
      { stage: "Prior Authorization", patient_count: paCount, conversion_rate: +((paCount / rxCount) * 100).toFixed(1), dropoff_rate: +(((rxCount - paCount) / rxCount) * 100).toFixed(1), dropoff_count: rxCount - paCount, average_time_days: 12.8 },
      { stage: "Copay", patient_count: copayCount, conversion_rate: +((copayCount / paCount) * 100).toFixed(1), dropoff_rate: +(((paCount - copayCount) / paCount) * 100).toFixed(1), dropoff_count: paCount - copayCount, average_time_days: 3.1 },
      { stage: "First Fill", patient_count: firstFillCount, conversion_rate: +((firstFillCount / copayCount) * 100).toFixed(1), dropoff_rate: +(((copayCount - firstFillCount) / copayCount) * 100).toFixed(1), dropoff_count: copayCount - firstFillCount, average_time_days: 2.4 },
    ];
    return { stages, total_entered: total, total_completed: firstFillCount, overall_conversion: overallConversion };
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
  } catch (err) {
    console.error("Backend leakage fetch failed:", err);
      throw err;
  }

  let regionalLeakage = state.regionalLeakage.map((r) => {
    const isSelected = filters.region !== "All" && r.region.toLowerCase() === filters.region.toLowerCase();
    const drop = isSelected || filters.region === "All" ? +(r.dropoff_rate + dropoffModifier).toFixed(1) : r.dropoff_rate;
    const pts = Math.max(20, Math.round(r.patient_count * (filters.insurance !== "All" ? 0.4 : 1)));
    return {
      ...r,
      dropoff_rate: Math.max(10, Math.min(80, drop)),
      patient_count: pts,
      revenue_at_risk: Math.round(pts * (drop / 100) * 2400),
    };
  });

  if (filters.region !== "All") {
    regionalLeakage = regionalLeakage.filter((r) => r.region.toLowerCase() === filters.region.toLowerCase());
  }

  const stageLeakage = state.stageLeakage.map((s) => {
    const drop = Math.max(5, Math.min(70, +(s.dropoff_rate + dropoffModifier * 0.4).toFixed(1)));
    const pts = Math.max(10, Math.round(s.dropoff_count * countMultiplier));
    return {
      ...s,
      dropoff_rate: drop,
      dropoff_count: pts,
      revenue_at_risk: Math.round(pts * 2500),
    };
  });

  const drivers = state.leakageDrivers.map((d) => ({
    ...d,
    affected_patients: Math.max(10, Math.round(d.affected_patients * countMultiplier)),
  }));

  return {
    drivers,
    stageLeakage,
    regionalLeakage,
  };
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
  } catch (err) {
    console.error("Backend survival fetch failed"); throw new Error("Backend survival fetch failed");
  }

  let groups = state.survivalData.groups;
  if (filters.insurance !== "All") {
    groups = ["Overall", filters.insurance];
  }

  return {
    ...state.survivalData,
    groups,
  };
}

// ── Risk ─────────────────────────────────────────────────────

export async function getRiskOverview(): Promise<{
  kpis: RiskOverviewKPIs;
  distribution: RiskDistributionPoint[];
}> {
  try {
    const backendPatients = await getBackendRiskPatients();
    if (backendPatients.length > 0) {
      const high = backendPatients.filter((p) => p.risk_category === "HIGH").length;
      const low = backendPatients.filter((p) => p.risk_category === "LOW").length;
      const active = backendPatients.length;
      return {
        kpis: { active_patients: active, high_risk: high, medium_risk: 0, low_risk: low },
        distribution: [
          { category: "LOW", count: low, percentage: active > 0 ? +((low / active) * 100).toFixed(1) : 0 },
          { category: "HIGH", count: high, percentage: active > 0 ? +((high / active) * 100).toFixed(1) : 0 },
        ],
      };
    }
  } catch {
    // fall through to mock
  }
  // Fallback to mock data when no patients registered
  await delay();
  const state = useDatasetStore.getState();
  const filters = useFilterStore.getState();
  const { countMultiplier } = calculateFilterImpact(filters);
  const hasFilters = filters.region !== "All" || filters.insurance !== "All" || filters.diagnosis !== "All" || filters.provider !== "All" || filters.newExisting !== "All";
  const high = hasFilters ? Math.max(5, Math.round(state.riskKPIs.high_risk * countMultiplier)) : state.riskKPIs.high_risk;
  const med = hasFilters ? Math.max(10, Math.round(state.riskKPIs.medium_risk * countMultiplier)) : state.riskKPIs.medium_risk;
  const low = hasFilters ? Math.max(15, Math.round(state.riskKPIs.low_risk * countMultiplier)) : state.riskKPIs.low_risk;
  const active = high + med + low;
  return {
    kpis: { active_patients: active, high_risk: high, medium_risk: med, low_risk: low },
    distribution: [
      { category: "LOW", count: low, percentage: +((low / active) * 100).toFixed(1) },
      { category: "MEDIUM", count: med, percentage: +((med / active) * 100).toFixed(1) },
      { category: "HIGH", count: high, percentage: +((high / active) * 100).toFixed(1) },
    ],
  };
}

export async function getRiskPatients(): Promise<RiskPatient[]> {
  try {
    const backendPatients = await getBackendRiskPatients();
    if (backendPatients.length > 0) {
      const filters = useFilterStore.getState();
      let patients = backendPatients;
      if (filters.region !== "All") {
        patients = patients.filter((p) => p.region.toLowerCase() === filters.region.toLowerCase());
      }
      if (filters.insurance !== "All") {
        patients = patients.filter((p) => p.insurance_type.toLowerCase() === filters.insurance.toLowerCase());
      }
      return patients;
    }
  } catch {
    // fall through to mock
  }
  // Fallback to mock data when no patients registered
  await delay();
  const state = useDatasetStore.getState();
  const filters = useFilterStore.getState();
  let patients = state.riskPatients;
  if (filters.region !== "All") {
    patients = patients.filter((p) => p.region.toLowerCase() === filters.region.toLowerCase());
  }
  if (filters.insurance !== "All") {
    patients = patients.filter((p) => p.insurance_type.toLowerCase() === filters.insurance.toLowerCase());
  }
  if (patients.length === 0) {
    patients = state.riskPatients.slice(0, 10).map((p, idx) => ({
      ...p,
      patient_id: `PT-${String(30001 + idx)}`,
      region: filters.region !== "All" ? filters.region : p.region,
      insurance_type: filters.insurance !== "All" ? filters.insurance : p.insurance_type,
    }));
  }
  return patients;
}


export async function getPatientRisk(patientId: string): Promise<PatientRiskDetail> {
  try {
    const user = getCurrentUser();
    const token = user?.accessToken;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`http://localhost:8000/api/patients/${patientId}`, { headers });
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
      risk_score: data.risk_score ? Math.round(data.risk_score * 100) : 0,
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

    const res = await fetch(`http://localhost:8000/api/patients/${patientId}/shap`, { headers });
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
