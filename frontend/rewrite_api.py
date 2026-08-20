import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Replace getCohorts
old_getCohorts = '''export async function getCohorts(): Promise<{
  heatmap: CohortHeatmapCell[];
  comparisons: CohortComparison[];
}> {
  await delay();
  const state = useDatasetStore.getState();
  const filters = useFilterStore.getState();

  let heatmap = state.cohortHeatmap;
  let comparisons = state.cohortComparisons;'''

new_getCohorts = '''export async function getCohorts(): Promise<{
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
      comparisons = backendData.cohorts.comparisons;
    }
  } catch (err) {
    console.warn("Backend cohorts fetch failed, falling back to mock", err);
  }'''

content = content.replace(old_getCohorts, new_getCohorts)

# Replace getLeakage
old_getLeakage = '''export async function getLeakage(): Promise<{
  drivers: LeakageDriver[];
  stageLeakage: StageLeakage[];
  regionalLeakage: RegionalLeakage[];
}> {
  await delay();
  const state = useDatasetStore.getState();
  const filters = useFilterStore.getState();
  const { countMultiplier, dropoffModifier } = calculateFilterImpact(filters);

  let regionalLeakage = state.regionalLeakage.map((r) => {'''

new_getLeakage = '''export async function getLeakage(): Promise<{
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
        stageLeakage: backendData.leakage.stageLeakage,
        regionalLeakage: regional
      };
    }
  } catch (err) {
    console.warn("Backend leakage fetch failed, falling back to mock");
  }

  let regionalLeakage = state.regionalLeakage.map((r) => {'''

content = content.replace(old_getLeakage, new_getLeakage)

# Replace getSurvival
old_getSurvival = '''export async function getSurvival(): Promise<SurvivalData> {
  await delay();
  const state = useDatasetStore.getState();
  const filters = useFilterStore.getState();

  let groups = state.survivalData.groups;'''

new_getSurvival = '''export async function getSurvival(): Promise<SurvivalData> {
  await delay();
  const state = useDatasetStore.getState();
  const filters = useFilterStore.getState();

  try {
    const backendData = await getBackendAnalytics();
    if (backendData.survival && backendData.survival.time.length > 0) {
      let groups = backendData.survival.groups;
      if (filters.insurance !== "All" && groups.includes(filters.insurance)) {
        groups = ["Overall", filters.insurance];
      }
      return {
        time: backendData.survival.time,
        groups: groups,
        data: backendData.survival.data
      };
    }
  } catch (err) {
    console.warn("Backend survival fetch failed, falling back to mock");
  }

  let groups = state.survivalData.groups;'''

content = content.replace(old_getSurvival, new_getSurvival)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Updated api.ts successfully.")
