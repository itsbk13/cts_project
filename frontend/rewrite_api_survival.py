import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_getSurvival = '''export async function getSurvival(): Promise<SurvivalData> {
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
  }'''

new_getSurvival = '''export async function getSurvival(): Promise<SurvivalData> {
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
    console.warn("Backend survival fetch failed, falling back to mock");
  }'''

content = content.replace(old_getSurvival, new_getSurvival)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Updated getSurvival in api.ts successfully.")
