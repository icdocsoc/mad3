export default function (feature: FeatureFlag): boolean {
  const url = useRequestURL();
  const featureFlags =
    new URLSearchParams(url.search).get('featureFlags')?.split(',') || [];

  return featureFlags.includes(feature);
}
