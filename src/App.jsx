import React from 'react'
import { AppProvider, useAppContext } from './context/AppContext'
import { MainLayout } from './components/layout/MainLayout'
import { ApiInterceptView } from './views/ApiInterceptView'
import { ModelScanningView } from './views/ModelScanningView'
import { RedTeamingView } from './views/RedTeamingView'
import { HomeView } from './views/HomeView'

function AppContent() {
  const { state } = useAppContext()

  if (state.activeView === 'home') {
    return <HomeView />
  }

  const renderView = () => {
    switch (state.activeView) {
      case 'apiIntercept':   return <ApiInterceptView />
      case 'modelScanning':  return <ModelScanningView />
      case 'redTeaming':     return <RedTeamingView />
      default:               return <ApiInterceptView />
    }
  }

  return (
    <MainLayout viewKey={state.activeView}>
      {renderView()}
    </MainLayout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
