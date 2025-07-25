import { useEffect } from "react";
import "./App.css";

// Import components
import { Header } from "./components/Header.tsx";
import { ColumnsContainer } from "./components/ColumnsContainer.tsx";
import { TableSection } from "./components/TableSection.tsx";
import { BatcherInput } from "./components/BatcherInput.tsx";
import { WalletDemo } from "./components/WalletDemo.tsx";
import { privateKeyToAccount } from "@paimaexample/concise";
console.log(
  privateKeyToAccount(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  ),
);
// Import hooks
import { useBlockchainData } from "./hooks/useBlockchainData.ts";
import { useTableData } from "./hooks/useTableData.ts";

function App() {
  // Use custom hooks for data management
  const {
    chainConfigs,
    newBlockIndices,
    latestBlock,
    isConnected,
  } = useBlockchainData();

  const {
    primitiveData,
    staticTableData,
    scheduledData,
  } = useTableData();

  // Error handling for uncaught promises
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" && event.ctrlKey) {
        event.preventDefault();
        console.log("🔄 Manually refreshed (keyboard shortcut)");
        // You could add manual refresh logic here if needed
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="container">
      <Header
        latestBlock={latestBlock}
        isConnected={isConnected}
      />

      <ColumnsContainer
        chainConfigs={chainConfigs}
        newBlockIndices={newBlockIndices}
      />

      <WalletDemo />

      {
        /* <TableSection
        title="Primitive Data"
        tables={primitiveData}
      />

      <TableSection
        title="State Machine Tables"
        tables={staticTableData}
      >
        <BatcherInput />
      </TableSection>

      <TableSection
        title="Scheduled Data"
        tables={scheduledData}
      /> */
      }
    </div>
  );
}

export default App;
