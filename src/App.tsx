import { WebRouter } from "./router/index";
import store from "./store/store";
import { Provider } from "react-redux";

function App() {
  return (
    <Provider store={store}>
      <WebRouter />
    </Provider>
  );
}

export default App;