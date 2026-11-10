import { Shell } from './components/Shell'
import { Guides, GuideDetail } from './screens/Guides'
import { Help } from './screens/Help'
import { Home } from './screens/Home'
import { Phrases } from './screens/Phrases'
import { RouteScreen } from './screens/Route'
import { Settings } from './screens/Settings'
import { Share, ShareView } from './screens/Share'
import { Lesson, Training } from './screens/Training'
import { route, type Route } from './state/router'

function Screen({ current }: { current: Route }) {
  switch (current.name) {
    case 'home':
      return <Home />
    case 'guides':
      return <Guides category={current.category} />
    case 'guide':
      return <GuideDetail id={current.id} />
    case 'share':
      return <Share />
    case 'share-view':
      return <ShareView id={current.id} />
    case 'phrases':
      return <Phrases />
    case 'route':
      return <RouteScreen />
    case 'help':
      return <Help />
    case 'training':
      return <Training />
    case 'lesson':
      return <Lesson id={current.id} />
    case 'settings':
      return <Settings />
  }
}

export function App() {
  return (
    <Shell>
      <Screen current={route.value} />
    </Shell>
  )
}
