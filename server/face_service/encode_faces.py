import json
import sys
import cv2
import numpy as np

def encode_face(image_path):
    try:
        from deepface import DeepFace
        
        img_bgr = cv2.imread(image_path, cv2.IMREAD_COLOR)
        if img_bgr is None:
            print(json.dumps(None))
            return None

        # Resize
        max_width = 800
        h, w = img_bgr.shape[:2]
        if w > max_width:
            scale = max_width / w
            img_bgr = cv2.resize(img_bgr, (max_width, int(h * scale)))

        # Save resized temp image
        temp_path = "temp_encode.jpg"
        cv2.imwrite(temp_path, img_bgr)

        # Get face embedding using DeepFace
        result = DeepFace.represent(
            img_path=temp_path,
            model_name="Facenet",
            enforce_detection=True
        )

        import os
        os.remove(temp_path)

        if result and len(result) > 0:
            return result[0]["embedding"]
        return None

    except Exception as e:
        print(f"DEBUG error: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    result = encode_face(sys.argv[1])
    print(json.dumps(result))