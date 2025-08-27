import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import Record from '../pages/Record'
import History from '../pages/History'
import Stats from '../pages/Stats'
import Settings from '../pages/Settings'
import Auth from '../pages/Auth'

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'record',
        element: <Record />
      },
      {
        path: 'history',
        element: <History />
      },
      {
        path: 'stats',
        element: <Stats />
      },
      {
        path: 'settings',
        element: <Settings />
      }
    ]
  }
])

export default function Router() {
  return <RouterProvider router={router} />
}