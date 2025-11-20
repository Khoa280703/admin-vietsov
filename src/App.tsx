import { ArticleEditorMain } from './components/ArticleEditor/ArticleEditorMain';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import './styles/editor.css';
import './styles/toolbar.css';
import './styles/responsive.css';

function App() {
  return (
    <ThemeProvider>
      <ArticleEditorMain />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
