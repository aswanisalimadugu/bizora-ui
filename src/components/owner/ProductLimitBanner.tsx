import { PlanLimitBanner } from './PlanLimitBanner';
import type { PlanLimits } from '../../types';

interface ProductLimitBannerProps {
  limits: PlanLimits | null;
}

export function ProductLimitBanner({ limits }: ProductLimitBannerProps) {
  return (
    <PlanLimitBanner
      limits={limits}
      label="Products"
      nearLimitMessage="You've reached your plan limit. Upgrade to add more products."
    />
  );
}
