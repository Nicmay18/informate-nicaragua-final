'use client';

import useThirdPartyScripts from '@/hooks/useThirdPartyScripts';

interface Props {
  gtmId?: string;
  adsClient?: string;
  fundingChoices?: boolean;
}

/**
 * Componente cliente que carga scripts de terceros de forma diferida:
 * - GTM después de LCP
 * - Google Ads 2s después de load o al scroll
 * - FundingChoices con detección EU/EEA
 */
export default function ThirdPartyScripts({
  gtmId = 'G-W1B5J61WEP',
  adsClient = 'ca-pub-4115203339551838',
  fundingChoices = true,
}: Props) {
  useThirdPartyScripts({ gtmId, adsClient, fundingChoices });
  return null;
}
