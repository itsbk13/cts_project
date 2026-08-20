import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Fix getPatientRisk fallback
old_catch = '''  } catch (err) {
    console.error("Falling back to mock patient detail:", err);
    // Since we cleared datasetStore, we just return an empty shell on error
    return {
      patient_id: patientId,
      risk_score: 0,
      risk_category: "LOW",
      current_stage: "Diagnosis",
      days_in_current_stage: 0,
      risk_factors: [],
      journey_timeline: [],
      recommended_action: "",
      estimated_revenue_at_risk: 0
    };
  }'''

new_catch = '''  } catch (err) {
    console.error("Failed to fetch patient detail:", err);
    return null as any; // Return null so the UI knows it failed
  }'''

content = content.replace(old_catch, new_catch)

# Fix getPatientSHAP fallback
old_shap_catch = '''  } catch (err) {
    console.error("Falling back to mock patient SHAP:", err);
    return useDatasetStore.getState().getPatientSHAPExplanation(patientId);
  }'''

new_shap_catch = '''  } catch (err) {
    console.error("Failed to fetch patient SHAP:", err);
    return null as any;
  }'''

content = content.replace(old_shap_catch, new_shap_catch)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Updated catch blocks to return null.")
