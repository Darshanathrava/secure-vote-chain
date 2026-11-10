import json
import sys
import numpy as np
from face_common import get_embedding

THRESHOLD = 0.363  # OpenCV's recommended cosine threshold for SFace


def main():
    emb, err = get_embedding(sys.argv[1])
    if emb is None:
        print(json.dumps({"match": False, "reason": err}))
        return

    live = np.array(emb, dtype=float)
    stored = np.array(json.loads(sys.argv[2]), dtype=float)
    if live.shape != stored.shape:
        print(json.dumps({"match": False, "reason": "encoding_mismatch_re_enroll"}))
        return

    sim = float(np.dot(live, stored) / (np.linalg.norm(live) * np.linalg.norm(stored)))
    print(f"DEBUG: cosine_similarity={sim:.4f}", file=sys.stderr)
    print(json.dumps({"match": bool(sim > THRESHOLD), "similarity": sim}))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"DEBUG error: {e}", file=sys.stderr)
        print(json.dumps({"match": False, "reason": str(e)}))
