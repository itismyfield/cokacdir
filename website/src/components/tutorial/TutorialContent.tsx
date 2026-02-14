import GettingStarted from './sections/GettingStarted'
import InterfaceOverview from './sections/InterfaceOverview'
import BasicNavigation from './sections/BasicNavigation'
import PanelSystem from './sections/PanelSystem'
import FileSelection from './sections/FileSelection'
import SortingFiltering from './sections/SortingFiltering'
import FileOperations from './sections/FileOperations'
import SearchFind from './sections/SearchFind'
import ViewerEditor from './sections/ViewerEditor'
import DiffCompare from './sections/DiffCompare'
import GitIntegration from './sections/GitIntegration'
import AICommands from './sections/AICommands'
import ProcessManager from './sections/ProcessManager'
import ImageViewer from './sections/ImageViewer'
import SettingsConfig from './sections/SettingsConfig'
import RemoteConnections from './sections/RemoteConnections'
import BookmarksHelp from './sections/BookmarksHelp'
import KeyboardReference from './sections/KeyboardReference'

export default function TutorialContent() {
  return (
    <div>
      <GettingStarted />
      <InterfaceOverview />
      <BasicNavigation />
      <PanelSystem />
      <FileSelection />
      <SortingFiltering />
      <FileOperations />
      <SearchFind />
      <ViewerEditor />
      <DiffCompare />
      <GitIntegration />
      <AICommands />
      <ProcessManager />
      <ImageViewer />
      <SettingsConfig />
      <RemoteConnections />
      <BookmarksHelp />
      <KeyboardReference />
    </div>
  )
}
