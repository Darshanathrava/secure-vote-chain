import json
import sys
import cv2
import numpy as np

def verify(live_image_path, stored_encoding):
    try:
        from deepface import DeepFace

        img_bgr = cv2.imread(live_image_path, cv2.IMREAD_COLOR)
        if img_bgr is None:
            print(json.dumps({"match": False, "reason": "could_not_load_image"}))
            return

        # Resize
        max_width = 800
        h, w = img_bgr.shape[:2]
        if w > max_width:
            scale = max_width / w
            img_bgr = cv2.resize(img_bgr, (max_width, int(h * scale)))

        temp_path = "temp_verify.jpg"
        cv2.imwrite(temp_path, img_bgr)

        # Get live face embedding
        result = DeepFace.represent(
            img_path=temp_path,
            model_name="Facenet",
            enforce_detection=True
        )

        import os
        os.remove(temp_path)

        if not result or len(result) == 0:
            print(json.dumps({"match": False, "reason": "no_face_detected"}))
            return

        live_embedding = np.array(result[0]["embedding"])
        stored = np.array(stored_encoding)

        # Cosine similarity
        cosine_sim = np.dot(live_embedding, stored) / (
            np.linalg.norm(live_embedding) * np.linalg.norm(stored)
        )

        print(f"DEBUG: cosine_similarity={cosine_sim:.4f}", file=sys.stderr)

        # Threshold: above 0.7 is a match
        match = bool(cosine_sim > 0.7)
        print(json.dumps({"match": match, "similarity": float(cosine_sim)}))

    except Exception as e:
        print(f"DEBUG error: {e}", file=sys.stderr)
        print(json.dumps({"match": False, "reason": str(e)}))

if __name__ == "__main__":
    image_path = sys.argv[1]
    stored = json.loads(sys.argv[2])
    verify(image_path, stored)