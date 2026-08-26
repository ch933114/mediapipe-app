const REAR_CAMERA_CONSTRAINTS: MediaTrackConstraints[] = [
  {
    facingMode: { exact: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 960 },
  },
  {
    facingMode: "environment",
    width: { ideal: 1280 },
    height: { ideal: 960 },
  },
  {
    width: { ideal: 1280 },
    height: { ideal: 960 },
  },
];

export async function requestRearCameraStream() {
  for (const video of REAR_CAMERA_CONSTRAINTS) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video,
        audio: false,
      });
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === "OverconstrainedError" ||
          error.name === "NotFoundError")
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Rear camera is unavailable.");
}
