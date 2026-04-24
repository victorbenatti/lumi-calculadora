import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (measurementId) {
  ReactGA.initialize(measurementId);
}

export function Analytics() {
  const location = useLocation();

  useEffect(() => {
    if (!measurementId) return;
    
    // Evita rastreamento de gestores no admin
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/login')) {
      return;
    }

    ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search });
  }, [location]);

  return null;
}
