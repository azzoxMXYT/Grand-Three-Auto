// Conservative launch preset for integrated graphics and shared-memory PCs.
export function renderScale(width, height, deviceRatio = 1, high = false) {
  return high
    ? Math.min(deviceRatio, 1.5)
    : Math.min(
        deviceRatio,
        0.85,
        1280 / Math.max(1, width),
        720 / Math.max(1, height),
      );
}
export function frameInterval(high, paused) {
  return 1000 / (paused ? 10 : high ? 60 : 30);
}
