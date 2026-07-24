import type { CampaignConfig } from './types';
import { diaDasMaes } from './diaDasMaes';
import { diaDosPais } from './diaDosPais';

export type { CampaignConfig, CampaignPalette } from './types';

// Ordem do array define a ordem de exibição no Header e no carrossel.
const allCampaigns: CampaignConfig[] = [diaDasMaes, diaDosPais];

export const campaigns: Record<string, CampaignConfig> = Object.fromEntries(
  allCampaigns.map((c) => [c.slug, c])
);

export const getCampaign = (slug: string): CampaignConfig | undefined =>
  campaigns[slug];

export const getActiveCampaigns = (): CampaignConfig[] =>
  allCampaigns.filter((c) => c.ativa);

export const getAllCampaigns = (): CampaignConfig[] => allCampaigns;
