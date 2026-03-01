from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import numpy as np

app = FastAPI(title='JEET Predictor Service')
DISCLAIMER = "Predictions are probabilistic and based on historical data. They are not guaranteed."

TRAINING = [
    ("derive mirror formula and lens numericals", "Light"),
    ("ohm law resistance electricity numericals", "Electricity"),
    ("carbon compounds nomenclature properties", "Carbon and its Compounds"),
    ("electrostatics derivations electric field", "Electrostatics"),
    ("ray optics lens maker", "Ray Optics"),
    ("important organic name reactions", "Organic Chemistry"),
]

vectorizer = TfidfVectorizer(ngram_range=(1,2))
X = vectorizer.fit_transform([x[0] for x in TRAINING])
y = np.array([x[1] for x in TRAINING])
model = LogisticRegression(max_iter=500)
model.fit(X, y)

FREQUENCY = {
    "Light": {"years": [2021, 2022, 2023], "score": 0.92},
    "Electricity": {"years": [2020, 2022, 2023], "score": 0.89},
    "Electrostatics": {"years": [2019, 2021, 2023], "score": 0.9},
    "Ray Optics": {"years": [2020, 2022, 2023], "score": 0.87},
}

class PredictRequest(BaseModel):
    query: str
    board: str = 'CBSE'
    subject: str
    class_level: int

@app.post('/predict/top_questions')
def top_questions(req: PredictRequest):
    feats = vectorizer.transform([req.query])
    probs = model.predict_proba(feats)[0]
    labels = model.classes_
    ranked = sorted(zip(labels, probs), key=lambda x: x[1], reverse=True)[:3]
    output = []
    for chapter, p in ranked:
      freq = FREQUENCY.get(chapter, {"years": [2023], "score": 0.75})
      probability = float(round(100 * (0.7 * p + 0.3 * freq['score']), 2))
      output.append({
          "chapter": chapter,
          "probability_percentage": probability,
          "confidence_score": round(float(p), 3),
          "evidence_years": freq['years'],
          "explanation": f"Ranked using TF-IDF + Logistic Regression with frequency weighting for {req.subject}."
      })
    return {"results": output, "disclaimer": DISCLAIMER}

@app.post('/predict/chapter_probability')
def chapter_probability(req: PredictRequest):
    feats = vectorizer.transform([req.query])
    probs = model.predict_proba(feats)[0]
    labels = model.classes_
    return {
        "results": [
            {"chapter": c, "probability_percentage": round(float(p*100),2)}
            for c, p in sorted(zip(labels, probs), key=lambda x: x[1], reverse=True)
        ],
        "disclaimer": DISCLAIMER
    }
