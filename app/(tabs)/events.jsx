import PublicEventsScreen from '../dashboards/cliente-eventos';
import CasaShowEventosScreen from '../dashboards/casashow-eventos';
import { useAuth } from '../../contexts/AuthContext';

export default function EventsRoute() {
  const { session } = useAuth();

  if (session?.tipo === 'CASASHOW') {
    return <CasaShowEventosScreen />;
  }

  return <PublicEventsScreen />;
}
