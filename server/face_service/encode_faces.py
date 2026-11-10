import json
import sys
from face_common import get_embedding

if __name__ == "__main__":
    try:
        emb, err = get_embedding(sys.argv[1])
        if err:
            print(f"DEBUG error: {err}", file=sys.stderr)
        print(json.dumps(emb))
    except Exception as e:
        print(f"DEBUG error: {e}", file=sys.stderr)
        print(json.dumps(None))
