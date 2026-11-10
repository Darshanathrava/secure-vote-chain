import os
import cv2

MODELS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
DET = os.path.join(MODELS, "face_detection_yunet_2023mar.onnx")
REC = os.path.join(MODELS, "face_recognition_sface_2021dec.onnx")


def get_embedding(image_path):
    """Return (embedding_list, None) or (None, reason)."""
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if img is None:
        return None, "could_not_load_image"

    h, w = img.shape[:2]
    if w > 800:
        img = cv2.resize(img, (800, int(h * 800 / w)))
        h, w = img.shape[:2]

    detector = cv2.FaceDetectorYN.create(DET, "", (w, h), 0.8, 0.3, 5000)
    detector.setInputSize((w, h))
    _, faces = detector.detect(img)
    if faces is None or len(faces) == 0:
        return None, "no_face_detected"

    face = max(faces, key=lambda f: f[2] * f[3])  # largest face
    recognizer = cv2.FaceRecognizerSF.create(REC, "")
    aligned = recognizer.alignCrop(img, face)
    feat = recognizer.feature(aligned)
    return feat.flatten().astype(float).tolist(), None
