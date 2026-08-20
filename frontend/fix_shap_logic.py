import sys

with open("src/app/shap/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_load = '''      const [globalRes, patientRes] = await Promise.all([
        getGlobalSHAP(),
        getPatientSHAP(selectedPatientId),
      ]);
      setGlobalData(globalRes);
      setPatientData(patientRes);
    } catch {
      setError(true);
    } finally {'''

new_load = '''      const [globalRes, patientRes] = await Promise.all([
        getGlobalSHAP(),
        selectedPatientId ? getPatientSHAP(selectedPatientId) : Promise.resolve(null),
      ]);
      setGlobalData(globalRes);
      
      if (selectedPatientId && !patientRes) {
        setError(true);
        setPatientData(null);
      } else {
        setPatientData(patientRes);
      }
    } catch {
      setError(true);
    } finally {'''

content = content.replace(old_load, new_load)

with open("src/app/shap/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated shap/page.tsx")
