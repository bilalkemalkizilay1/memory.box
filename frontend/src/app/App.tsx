import DesktopApp from './desktop/DesktopApp';
import MobileApp from './mobile/MobileApp';
import { usePlatform } from '@/shared/hooks/usePlatform';

export default function App() {
  const { isMobile } = usePlatform();

  return isMobile ? <MobileApp /> : <DesktopApp />;
}
