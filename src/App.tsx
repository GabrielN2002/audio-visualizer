import AudioVisualizer from "./components/audio-visualizer";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
	return (
		<ThemeProvider
			defaultTheme="system"
			storageKey="vite-ui-theme"
		>
			<AudioVisualizer />
		</ThemeProvider>
	);
}

export default App;
