import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy_key"))

MODEL_NAME = "openai/gpt-oss-20b"

SYSTEM_PROMPT = """You are a clinical support assistant that helps hospital nurses and case managers prioritize patient outreach for therapy drop-off prevention.

You will be given a patient's risk level and their top contributing risk factors (from a machine learning model). Your job is to write a short, actionable recommendation for the nurse.

STRICT RULES:
1. Write EXACTLY 2 sentences. No more, no less.
2. Sentence 1: State what is driving this patient's risk, in plain clinical language — translate technical field names into natural phrases (e.g. "Claim_Rejected" becomes "a rejected insurance claim", "Max_PA_Delay_Days" becomes "a prior authorization delay", "Stockout_Experienced" becomes "a medication stockout", "Support_Enrolled" being 0 becomes "the patient is not enrolled in a support program", "Total_Contact_Attempts" being high becomes "repeated failed contact attempts").
3. Sentence 2: Recommend ONE specific, concrete next action the nurse or case manager should take. Be specific about WHO should act (e.g. "the Hub Coordinator", "the case manager") and WHAT they should do (e.g. "expedite the appeal", "enroll the patient in the copay assistance program", "attempt phone outreach today").
4. Do NOT restate or mention the numeric risk score or risk percentage.
5. Do NOT use hedging language like "may", "might consider", "possibly" — be direct and confident, this is a decision-support tool.
6. Do NOT provide a medical diagnosis or clinical treatment advice — you are addressing logistical/administrative barriers to therapy access only (insurance, authorization, affordability, contact/engagement), not medical judgment.
7. Do NOT use the literal internal field names (e.g. never write "Claim_Rejected" or "PA_Delay_Days" directly) — always translate to plain language.
8. If no clear risk factors are provided, give a general recommendation to review the patient's case manually rather than inventing a reason.

Output only the 2-sentence recommendation text. Do not include any preamble, labels, or explanation."""


def build_prompt(risk_level: str, top_factors: list) -> str:
    """Builds the user-turn prompt sent to the LLM."""
    sorted_factors = sorted(
        top_factors, key=lambda f: f.get("impact", 0), reverse=True
    )[:3]

    if sorted_factors:
        factors_text = "; ".join(
            f"{f['factor']} = {f['value']}" for f in sorted_factors
        )
    else:
        factors_text = "none provided"

    return f"Risk level: {risk_level}\nTop contributing factors: {factors_text}"


def generate_recommendation(risk_score: float, risk_level: str, top_factors: list) -> dict:
    """
    Generates a nurse-facing recommendation.

    Args:
        risk_score:  float, e.g. 0.91 (used for logging only, not sent to LLM)
        risk_level:  "High" or "Low" — pre-computed upstream, echoed back as-is
        top_factors: list of dicts with keys "factor", "value", "impact"

    Returns:
        dict with keys "recommendation" and "risk_level"
    """
    user_prompt = build_prompt(risk_level, top_factors)

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_completion_tokens=500,
            reasoning_effort="low",
            include_reasoning=False,
        )
        recommendation = response.choices[0].message.content or ""
        recommendation = recommendation.strip()

    except Exception as e:
        recommendation = (
            "Unable to generate recommendation at this time. "
            "Please review patient factors manually."
        )
        print(f"[LLM ERROR] patient risk_score={risk_score} | {e}")

    return {
        "recommendation": recommendation,
        "risk_level": risk_level,  # echoed exactly as received — never recomputed
    }


# =============================================================
# Standalone test — run directly with: python llm_recommendation.py
# =============================================================
if __name__ == "__main__":
    test_cases = [
        {
            "name": "High risk, 2 factors",
            "risk_score": 0.91,
            "risk_level": "High",
            "top_factors": [
                {"factor": "Claim_Rejected", "value": 1, "impact": 0.34},
                {"factor": "Max_PA_Delay_Days", "value": 27, "impact": 0.21},
            ],
        },
        {
            "name": "Low risk, 1 factor",
            "risk_score": 0.22,
            "risk_level": "Low",
            "top_factors": [
                {"factor": "Total_Contact_Attempts", "value": 0, "impact": 0.05},
            ],
        },
        {
            "name": "High risk, empty factors",
            "risk_score": 0.83,
            "risk_level": "High",
            "top_factors": [],
        },
        {
            "name": "High risk, more than 3 factors (should trim to top 3)",
            "risk_score": 0.95,
            "risk_level": "High",
            "top_factors": [
                {"factor": "Claim_Rejected", "value": 1, "impact": 0.34},
                {"factor": "Max_PA_Delay_Days", "value": 27, "impact": 0.21},
                {"factor": "Stockout_Experienced", "value": 1, "impact": 0.18},
                {"factor": "Support_Enrolled", "value": 0, "impact": 0.10},
                {"factor": "Total_Contact_Attempts", "value": 5, "impact": 0.05},
            ],
        },
    ]

    for case in test_cases:
        print(f"\n--- {case['name']} ---")
        result = generate_recommendation(
            risk_score=case["risk_score"],
            risk_level=case["risk_level"],
            top_factors=case["top_factors"],
        )
        print(result)
        assert result["risk_level"] == case["risk_level"], "risk_level was altered!"

    print("\n✅ All test cases passed.")
