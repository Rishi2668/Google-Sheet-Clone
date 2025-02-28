import React from 'react';
import { Provider } from 'react-redux';
import styled from 'styled-components';
import store from './state/store';

import Header from './components/core/Header';
import Toolbar from './components/core/Toolbar';
import FormulaBar from './components/core/FormulaBar';
import Grid from './components/grid/Grid';
import FindReplaceDialog from './components/dialogs/FindReplaceDialog';
import ContextMenu from './components/ui/ContextMenu';
import Toast from './components/ui/Toast';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  font-family: 'Roboto', 'Arial', sans-serif;
  font-size: 13px;
  color: #202124;
`;

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContainer>
        <Header />
        <Toolbar />
        <FormulaBar />
        <Grid />
        
        {/* Modals and overlays */}
        <FindReplaceDialog />
        <ContextMenu />
        <Toast />
      </AppContainer>
    </Provider>
  );
};

export default App;